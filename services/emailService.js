import "dotenv/config";

export const sendEmail = async ({ to, subject, text }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: process.env.EMAIL_FROM
      },
      to: [
        {
          email: to
        }
      ],
      subject,
      textContent: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${error}`);
  }

  return await response.json();
};

export default sendEmail;
