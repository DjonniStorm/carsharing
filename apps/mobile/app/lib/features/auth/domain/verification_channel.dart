enum VerificationChannel {
  email('email'),
  sms('sms');

  const VerificationChannel(this.apiValue);

  final String apiValue;

  static VerificationChannel? fromApiValue(String? value) {
    if (value == null) return null;
    for (final channel in VerificationChannel.values) {
      if (channel.apiValue == value) return channel;
    }
    return null;
  }
}

class SendVerificationCodeResult {
  const SendVerificationCodeResult({
    required this.channel,
    required this.message,
  });

  final VerificationChannel channel;
  final String message;
}
