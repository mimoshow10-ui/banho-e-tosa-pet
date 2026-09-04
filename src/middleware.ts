import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rota de login do admin e rota de autenticação de API
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next();
  }

  // Interceptar rotas do Painel Admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const sessionToken = req.cookies.get('admin_session')?.value;

    if (!sessionToken || !sessionToken.startsWith('admin_session_')) {
      // Se for uma requisição de API, retornar 403 Forbidden
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { erro: 'Acesso Administrativo Negado. Autentique-se com mimoshow01@gmail.com' },
          { status: 403 }
        );
      }

      // Se for uma rota de página do admin, redirecionar para a tela de login
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
