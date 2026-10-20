/** Every SMS vendor sits behind this class, so switching vendors touches one file. */
export abstract class SmsProvider {
  abstract sendOtp(mobile: string, code: string): Promise<void>;
}
