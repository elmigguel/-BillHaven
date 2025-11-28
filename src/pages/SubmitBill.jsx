import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BillSubmissionForm from '../components/bills/BillSubmissionForm';

export default function SubmitBill() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(createPageUrl('MyBills'));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-6 text-gray-300 hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <BillSubmissionForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}