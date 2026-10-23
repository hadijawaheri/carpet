/** The messages the site sends; each vendor maps a template to its own approved pattern. */
export type SmsTemplate = "otp";

/** Every SMS vendor sits behind this class, so switching vendors touches one file. */
export abstract class SmsProvider {
  abstract send(to: string, template: SmsTemplate, args: string[]): Promise<void>;
}
