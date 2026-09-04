const nodemailer = require('nodemailer');

async function testEmail() {
  // Testar Nodemailer com SMTP test account
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  let info = await transporter.sendMail({
    from: '"Banho e Tosa Pet" <admin@banhoetosapet.com>',
    to: "mimoshow01@gmail.com",
    subject: "Acesso Banho e Tosa Pet",
    text: "Seu código de acesso: 849201",
    html: "<b>Seu código de acesso: 849201</b>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

testEmail();
