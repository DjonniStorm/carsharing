import 'dart:async';

import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/api/dio_error_message.dart';
import '../../../app/router/app_routes.dart';
import '../../../shared/validation/input_validators.dart';
import '../../profile/cubit/profile_cubit.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';
import '../domain/verification_channel.dart';
import 'firebase_sms_recaptcha_screen.dart';

const _resendCooldownSeconds = 60;

class VerifyAccountScreen extends StatefulWidget {
  const VerifyAccountScreen({
    super.key,
    required this.email,
    required this.phone,
  });

  final String email;
  final String phone;

  @override
  State<VerifyAccountScreen> createState() => _VerifyAccountScreenState();
}

class _VerifyAccountScreenState extends State<VerifyAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeCtrl = TextEditingController();

  VerificationChannel? _activeChannel;
  bool _sending = false;
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _codeCtrl.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _cooldownTimer?.cancel();
    setState(() => _cooldownSeconds = _resendCooldownSeconds);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_cooldownSeconds <= 1) {
        timer.cancel();
        setState(() => _cooldownSeconds = 0);
        return;
      }
      setState(() => _cooldownSeconds -= 1);
    });
  }

  Future<void> _sendCode(VerificationChannel channel) async {
    if (_sending || _cooldownSeconds > 0) return;

    String? recaptchaToken;
    if (channel == VerificationChannel.sms) {
      setState(() => _sending = true);
      try {
        final siteKey =
            await context.read<AuthCubit>().fetchFirebaseRecaptchaSiteKey();
        if (!mounted) return;
        recaptchaToken = await FirebaseSmsRecaptchaScreen.open(
          context,
          siteKey: siteKey,
        );
        if (!mounted) return;
        if (recaptchaToken == null || recaptchaToken.isEmpty) {
          return;
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
        return;
      } finally {
        if (mounted) setState(() => _sending = false);
      }
    }

    setState(() => _sending = true);
    try {
      final result = await context.read<AuthCubit>().sendVerificationCode(
            email: widget.email,
            channel: channel,
            recaptchaToken: recaptchaToken,
          );
      if (!mounted) return;
      setState(() => _activeChannel = result.channel);
      _startCooldown();
      if (result.message.isNotEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message)),
        );
      }
    } on DioException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(dioErrorMessage(e))),
      );
      if (e.response?.statusCode == 429) {
        _startCooldown();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String _channelLabel(VerificationChannel channel) {
    return switch (channel) {
      VerificationChannel.email => 'auth.channel_email'.tr(),
      VerificationChannel.sms => 'auth.channel_sms'.tr(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final codeSent = _activeChannel != null;

    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (p, n) => n is AuthAuthorized || n is AuthError,
      listener: (context, state) {
        if (state is AuthAuthorized) {
          // ignore: discarded_futures
          context.read<ProfileCubit>().load();
          context.go(AppRoutes.map);
        }
        if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text('auth.verify_account'.tr())),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'auth.verify_account_hint'.tr(),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const Gap(16),
                  _InfoRow(
                    label: 'auth.email'.tr(),
                    value: widget.email,
                  ),
                  const Gap(8),
                  _InfoRow(
                    label: 'auth.phone'.tr(),
                    value: widget.phone,
                  ),
                  const Gap(20),
                  if (!codeSent) ...[
                    OutlinedButton.icon(
                      onPressed: _sending || _cooldownSeconds > 0
                          ? null
                          : () => _sendCode(VerificationChannel.email),
                      icon: _sending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.email_outlined),
                      label: Text('auth.send_code_email'.tr()),
                    ),
                    const Gap(12),
                    OutlinedButton.icon(
                      onPressed: _sending || _cooldownSeconds > 0
                          ? null
                          : () => _sendCode(VerificationChannel.sms),
                      icon: _sending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.sms_outlined),
                      label: Text('auth.send_code_sms'.tr()),
                    ),
                  ] else ...[
                    Text(
                      'auth.code_sent_via'.tr(
                        namedArgs: {
                          'channel': _channelLabel(_activeChannel!),
                        },
                      ),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const Gap(12),
                    TextFormField(
                      controller: _codeCtrl,
                      decoration: InputDecoration(
                        labelText: 'auth.code'.tr(),
                        hintText: '000000',
                        counterText: '',
                      ),
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      maxLength: 6,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(6),
                      ],
                      validator: validateEmailCode,
                    ),
                    const Gap(12),
                    TextButton(
                      onPressed: _sending || _cooldownSeconds > 0
                          ? null
                          : () => _sendCode(_activeChannel!),
                      child: Text(
                        _cooldownSeconds > 0
                            ? 'auth.resend_in'.tr(
                                namedArgs: {
                                  'seconds': '$_cooldownSeconds',
                                },
                              )
                            : 'auth.resend_code'.tr(),
                      ),
                    ),
                    const Gap(8),
                    TextButton(
                      onPressed: _sending || _cooldownSeconds > 0
                          ? null
                          : () => setState(() => _activeChannel = null),
                      child: Text('auth.choose_other_channel'.tr()),
                    ),
                  ],
                  const Gap(16),
                  if (codeSent)
                    BlocBuilder<AuthCubit, AuthState>(
                      builder: (context, state) {
                        final loading = state is AuthLoading;
                        return FilledButton(
                          onPressed: loading
                              ? null
                              : () {
                                  if (!_formKey.currentState!.validate()) {
                                    return;
                                  }
                                  context.read<AuthCubit>().verifyAccount(
                                        email: widget.email,
                                        code: _codeCtrl.text.trim(),
                                      );
                                },
                          child: loading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text('common.continue'.tr()),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 72,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
      ],
    );
  }
}
