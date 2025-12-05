import { AlertCircle, ShieldCheck } from 'lucide-react';

const VerificationStatus = ({ profile }) => {
  if (!profile) return null;

  const isVerified = profile.kyc_status === 'verified';

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm border rounded-lg bg-green-50 text-green-700 border-green-200">
        <ShieldCheck className="w-5 h-5" />
        <p>
          <span className="font-semibold">Account Geverifieerd</span> - U heeft volledige toegang.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 text-sm border rounded-lg shadow-sm bg-amber-50 text-amber-800 border-amber-200">
      <AlertCircle className="w-6 h-6" />
      <div className="flex-grow">
        <p className="font-semibold">Verificatie vereist</p>
        <p className="text-xs">
          Om transacties te kunnen doen, moet u uw identiteit verifiëren. Dit is een eenmalig proces.
        </p>
      </div>
      <button className="px-4 py-2 text-xs font-medium text-white transition-colors rounded-md shadow-sm bg-amber-600 hover:bg-amber-700">
        Start Verificatie
      </button>
    </div>
  );
};

export default VerificationStatus;
