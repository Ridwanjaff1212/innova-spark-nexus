import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentEmailRequest {
  assignment: {
    title: string;
    description: string;
    type: string;
    priority: string;
    deadline: string | null;
  };
  recipientEmails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignment, recipientEmails }: AssignmentEmailRequest = await req.json();
    
    console.log("Sending assignment emails to:", recipientEmails.length, "recipients");
    console.log("Assignment:", assignment.title);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const priorityColors: Record<string, string> = {
      low: "#3b82f6",
      normal: "#22c55e",
      high: "#f59e0b",
      urgent: "#ef4444",
    };

    const priorityColor = priorityColors[assignment.priority] || "#722F37";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f8f8; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #722F37, #8B3A42); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">TechnoVista</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">New Assignment Notification</p>
          </div>
          <div style="padding: 30px;">
            <div style="margin-bottom: 20px;">
              <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase;">
                ${assignment.priority} Priority
              </span>
              <span style="background: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-left: 8px;">
                ${assignment.type}
              </span>
            </div>
            <h2 style="color: #722F37; margin: 0 0 16px 0; font-size: 22px;">${assignment.title}</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
              ${assignment.description || "No description provided."}
            </p>
            ${assignment.deadline ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Due Date:</strong> ${new Date(assignment.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            ` : ''}
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">Log in to your TechnoVista dashboard to view and complete this assignment.</p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated notification from TechnoVista Portal.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    let successful = 0;
    let failed = 0;

    for (const email of recipientEmails) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TechnoVista <onboarding@resend.dev>",
            to: [email],
            subject: `New Assignment: ${assignment.title}`,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          successful++;
          console.log(`Email sent to ${email}`);
        } else {
          failed++;
          const errorData = await response.text();
          console.error(`Failed to send email to ${email}:`, errorData);
        }
      } catch (err) {
        failed++;
        console.error(`Error sending to ${email}:`, err);
      }
    }

    console.log(`Emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successful, failed }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending assignment emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
