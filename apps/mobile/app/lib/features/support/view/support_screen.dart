import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../shared/config/app_config.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  Future<void> _launch(Uri uri) async {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok) {
      throw StateError('Could not launch $uri');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final faqItems = <({String q, String a})>[
      (
        q: 'support.faq_register_q'.tr(),
        a: 'support.faq_register_a'.tr(),
      ),
      (
        q: 'support.faq_verify_q'.tr(),
        a: 'support.faq_verify_a'.tr(),
      ),
      (
        q: 'support.faq_zone_q'.tr(),
        a: 'support.faq_zone_a'.tr(),
      ),
      (
        q: 'support.faq_start_q'.tr(),
        a: 'support.faq_start_a'.tr(),
      ),
      (
        q: 'support.faq_network_q'.tr(),
        a: 'support.faq_network_a'.tr(),
      ),
      (
        q: 'support.faq_contact_q'.tr(),
        a: 'support.faq_contact_a'.tr(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('support.title'.tr()),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'support.contacts'.tr(),
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.phone_outlined),
            title: Text('support.phone'.tr()),
            subtitle: SelectableText(AppConfig.supportPhone),
            onTap: () {
              final digits = AppConfig.supportPhone.replaceAll(RegExp(r'[^\d+]'), '');
              // ignore: discarded_futures
              _launch(Uri(scheme: 'tel', path: digits));
            },
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.email_outlined),
            title: Text('support.email'.tr()),
            subtitle: SelectableText(AppConfig.supportEmail),
            onTap: () {
              // ignore: discarded_futures
              _launch(Uri(
                scheme: 'mailto',
                path: AppConfig.supportEmail,
              ));
            },
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.schedule_outlined),
            title: Text('support.hours'.tr()),
          ),
          const SizedBox(height: 16),
          Text(
            'support.faq'.tr(),
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          for (final item in faqItems)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ExpansionTile(
                title: Text(
                  item.q,
                  style: theme.textTheme.titleSmall,
                ),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(item.a),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
