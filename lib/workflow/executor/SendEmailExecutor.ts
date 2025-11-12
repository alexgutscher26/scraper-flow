import { ExecutionEnvironment } from "@/types/executor";
import { SendEmailTask } from "../task/SendEmail";
import * as nodemailer from "nodemailer";
import { createLogger } from "@/lib/log";

export async function SendEmailExecutor(
  environment: ExecutionEnvironment<typeof SendEmailTask>
): Promise<boolean> {
  const logger = createLogger("executor/SendEmail");
  try {
    const emailCredentials = environment.getInput("Email credentials");
    const toEmail = environment.getInput("To email");
    const subject = environment.getInput("Subject");
    const body = environment.getInput("Body");
    const bodyType = environment.getInput("Body type") || "text";
    const attachments = environment.getInput("Attachments");

    // Validate required fields
    if (!emailCredentials) {
      environment.log.error("Email credentials are required");
      return false;
    }

    if (!toEmail) {
      environment.log.error("To email is required");
      return false;
    }

    if (!subject) {
      environment.log.error("Subject is required");
      return false;
    }

    if (!body) {
      environment.log.error("Body is required");
      return false;
    } // Parse email credentials (now properly formatted by credential system)
    let smtpConfig: any;
    try {
      smtpConfig = JSON.parse(emailCredentials);
    } catch (e) {
      environment.log.error(
        "Invalid email credentials format. Expected properly formatted SMTP credentials"
      );
      return false;
    }

    const { host, port, user, pass, service } = smtpConfig;

    if (!host || !port || !user || !pass) {
      environment.log.error(
        "Email credentials must include: host, port, user, pass"
      );
      return false;
    }

    environment.log.info(`Sending email to: ${toEmail}`); // Create transporter
    const transporter = nodemailer.createTransport({
      service: service,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });

    // Prepare email options
    const mailOptions: any = {
      from: user,
      to: toEmail,
      subject: subject,
    };

    // Set email body based on type
    if (bodyType === "html") {
      mailOptions.html = body;
    } else {
      mailOptions.text = body;
    }

    // Add attachments if provided
    if (attachments) {
      try {
        const attachmentList = JSON.parse(attachments);
        if (Array.isArray(attachmentList)) {
          mailOptions.attachments = attachmentList.map((attachment: any) => ({
            filename: attachment.filename,
            path: attachment.path,
            contentType: attachment.contentType,
          }));
        }
      } catch (e) {
        environment.log.error(
          "Invalid attachments format. Expected JSON array"
        );
        return false;
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    environment.setOutput(
      "Status",
      `Email sent successfully. Message ID: ${info.messageId}`
    );

    environment.log.info(
      `Email sent successfully. Message ID: ${info.messageId}`
    );

    return true;
  } catch (e: any) {
    logger.error(
      `error while sending email: ${e instanceof Error ? e.message : String(e)}`
    );
    environment.log.error(`Failed to send email: ${e.message}`);
    return false;
  }
}
