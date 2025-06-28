const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// You will provide the appointmentConfirmationTemplate in the next message
const appointmentConfirmationTemplate = require("./templates/appointmentConfirmationTemplate");
const appointmentCancellationTemplate = require("./templates/appointmentCancellationTemplate");
const appointmentRescheduleTemplate = require("./templates/appointmentRescheduleTemplate");

async function sendAppointmentConfirmationEmail({ to, name, appointmentDetails }) {
  try {
    // Fetch email config from DB (assuming only one config row)
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");

    // Fetch hospital settings
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    // Validate required fields
    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    // Setup nodemailer transport (unchanged)
    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    // Format date
    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    // Merge hospital info into appointmentDetails for template
    const templateData = {
      ...appointmentDetails,
      name,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    const compiledTemplate = Handlebars.compile(appointmentConfirmationTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    // Send the email
    const sendResult = await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Appointment Confirmation - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    console.log("Appointment email sent:", sendResult);
    return true;
  } catch (error) {
    console.error("Error sending appointment confirmation email:", error);
    return false;
  }
}

async function sendAppointmentCancellationEmail({ to, appointmentDetails }) {
  try {
    // Fetch email config from DB
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");

    // Fetch hospital settings
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    // Validate required fields
    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    // Setup nodemailer transport
    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    // Format date
    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    // Merge hospital info into appointmentDetails for template
    const templateData = {
      ...appointmentDetails,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    const compiledTemplate = Handlebars.compile(appointmentCancellationTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    // Send the email
    await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Appointment Cancellation - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error("Error sending appointment cancellation email:", error);
    return false;
  }
}

async function sendAppointmentRescheduleEmail({ to, appointmentDetails }) {
  try {
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    const templateData = {
      ...appointmentDetails,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    const compiledTemplate = Handlebars.compile(appointmentRescheduleTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Appointment Rescheduled - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error("Error sending appointment reschedule email:", error);
    return false;
  }
}

module.exports = {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
  sendAppointmentRescheduleEmail,
};