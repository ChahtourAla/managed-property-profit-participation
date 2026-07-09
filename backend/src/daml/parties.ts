import { ConfigService } from '@nestjs/config';

export interface DefaultParties {
  easycoin: string;
  owner: string;
  auditor: string;
  paymentVerifier: string;
  legalAdmin: string;
}

export function getDefaultParties(
  configService: ConfigService,
): DefaultParties {
  return {
    easycoin: configService.get<string>('DEFAULT_EASYCOIN_PARTY') || 'Easycoin',
    owner: configService.get<string>('DEFAULT_OWNER_PARTY') || 'Owner',
    auditor: configService.get<string>('DEFAULT_AUDITOR_PARTY') || 'Auditor',
    paymentVerifier:
      configService.get<string>('DEFAULT_PAYMENT_VERIFIER_PARTY') ||
      'PaymentVerifier',
    legalAdmin:
      configService.get<string>('DEFAULT_LEGAL_ADMIN_PARTY') || 'LegalAdmin',
  };
}
