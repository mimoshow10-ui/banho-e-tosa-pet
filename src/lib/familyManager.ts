import { supabase } from '@/lib/supabase';

export interface FamilyData {
  familyId: string;
  members: string[]; // Lista de todos os IDs de produtos membros da família (iguais/irmãos)
}

export interface FamilyConfig {
  familias: Record<string, FamilyData>; // Indexado por familyId
  productToFamilyMap: Record<string, string>; // Mapeia productId -> familyId
}

/**
 * Carrega a estrutura de famílias permanentes do Supabase em configuracoes.
 * Se ainda não existir a chave 'variacoes_familias_v2', inicializa a partir de 'variacoes_ordem'.
 */
export async function getFamilyConfig(): Promise<FamilyConfig> {
  try {
    const { data: cfgFamilias } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'variacoes_familias_v2')
      .maybeSingle();

    if (cfgFamilias?.valor && cfgFamilias.valor.familias && cfgFamilias.valor.productToFamilyMap) {
      return cfgFamilias.valor as FamilyConfig;
    }

    // Migrar da estrutura antiga 'variacoes_ordem' se existir
    const { data: cfgOrdem } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'variacoes_ordem')
      .maybeSingle();

    const mapOrdem: Record<string, string[]> = cfgOrdem?.valor || {};
    const familias: Record<string, FamilyData> = {};
    const productToFamilyMap: Record<string, string> = {};

    const processados = new Set<string>();

    for (const [key, list] of Object.entries(mapOrdem)) {
      if (!Array.isArray(list) || list.length === 0) continue;

      const sortedMembersStr = [...list].sort().join('|');
      if (processados.has(sortedMembersStr)) continue;
      processados.add(sortedMembersStr);

      const familyId = 'fam_' + Math.random().toString(36).substring(2, 9);
      const members = Array.from(new Set(list));

      familias[familyId] = {
        familyId,
        members,
      };

      for (const mId of members) {
        productToFamilyMap[mId] = familyId;
      }
    }

    const configInicial: FamilyConfig = { familias, productToFamilyMap };
    await saveFamilyConfig(configInicial);
    return configInicial;
  } catch (err) {
    console.error('[FAMILY MANAGER] Erro ao carregar famílias:', err);
    return { familias: {}, productToFamilyMap: {} };
  }
}

/**
 * Salva a estrutura de famílias e sincroniza a chave 'variacoes_ordem' para retrocompatibilidade total.
 */
export async function saveFamilyConfig(config: FamilyConfig): Promise<void> {
  try {
    // 1. Salva a modelagem permanente de famílias em variacoes_familias_v2
    await supabase.from('configuracoes').upsert({
      chave: 'variacoes_familias_v2',
      valor: config,
    }, { onConflict: 'chave' });

    // 2. Atualiza a mapa de compatibilidade retroativa variacoes_ordem
    const mapOrdem: Record<string, string[]> = {};

    for (const fam of Object.values(config.familias)) {
      if (!fam || !Array.isArray(fam.members) || fam.members.length === 0) continue;

      mapOrdem[fam.familyId] = fam.members;
      for (const mId of fam.members) {
        mapOrdem[mId] = fam.members;
      }
    }

    await supabase.from('configuracoes').upsert({
      chave: 'variacoes_ordem',
      valor: mapOrdem,
    }, { onConflict: 'chave' });
  } catch (err) {
    console.error('[FAMILY MANAGER] Erro ao salvar famílias:', err);
  }
}

/**
 * REGRA CENTRAL DO SISTEMA: MODELO DE FAMÍLIA DE PRODUTOS IRMÃOS (PEER-TO-PEER)
 * 
 * Vincular produtos a uma família NUNCA anula nem desmonta a família existente.
 * Todos os produtos (targetProductId, newMemberId e seus familiares existentes)
 * passam a ser membros iguais (irmãos) da mesma família.
 */
export async function linkProductToFamily(
  targetProductId: string,
  newMemberId: string
): Promise<FamilyData> {
  const config = await getFamilyConfig();

  const existingFamilyIdTarget = config.productToFamilyMap[targetProductId];
  const existingFamilyIdNew = config.productToFamilyMap[newMemberId];

  let activeFamilyId = existingFamilyIdTarget || existingFamilyIdNew;

  if (!activeFamilyId) {
    activeFamilyId = 'fam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }

  // Coletar todos os membros das famílias envolvidas sem perder nenhum
  const targetMembers = existingFamilyIdTarget && config.familias[existingFamilyIdTarget]
    ? config.familias[existingFamilyIdTarget].members
    : [targetProductId];

  const newMembers = existingFamilyIdNew && config.familias[existingFamilyIdNew]
    ? config.familias[existingFamilyIdNew].members
    : [newMemberId];

  const unifiedMembers = Array.from(new Set([...targetMembers, ...newMembers, targetProductId, newMemberId]));

  if (existingFamilyIdNew && existingFamilyIdNew !== activeFamilyId) {
    delete config.familias[existingFamilyIdNew];
  }

  config.familias[activeFamilyId] = {
    familyId: activeFamilyId,
    members: unifiedMembers,
  };

  for (const mId of unifiedMembers) {
    config.productToFamilyMap[mId] = activeFamilyId;
  }

  await saveFamilyConfig(config);
  return config.familias[activeFamilyId];
}

/**
 * Reordena a exibição dos membros de uma família sem remover ninguém.
 */
export async function reorderFamilyMembers(
  memberId: string,
  newOrderedMemberIds: string[]
): Promise<void> {
  const config = await getFamilyConfig();
  const familyId = config.productToFamilyMap[memberId];

  if (!familyId || !config.familias[familyId]) return;

  const family = config.familias[familyId];
  const finalMembers = Array.from(new Set([...newOrderedMemberIds, ...family.members]));

  family.members = finalMembers;
  await saveFamilyConfig(config);
}

/**
 * Remove um único membro da família mantendo todos os demais membros juntos.
 */
export async function removeMemberFromFamily(memberId: string): Promise<void> {
  const config = await getFamilyConfig();
  const familyId = config.productToFamilyMap[memberId];

  if (!familyId || !config.familias[familyId]) return;

  const family = config.familias[familyId];
  family.members = family.members.filter(id => id !== memberId);
  delete config.productToFamilyMap[memberId];

  if (family.members.length <= 1) {
    for (const mId of family.members) {
      delete config.productToFamilyMap[mId];
    }
    delete config.familias[familyId];
  }

  await saveFamilyConfig(config);
}
