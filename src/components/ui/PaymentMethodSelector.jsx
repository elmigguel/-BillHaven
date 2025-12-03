/**
 * PaymentMethodSelector - Premium card-based payment method selection
 * Replaces text input with beautiful clickable cards like Uniswap/Coinbase
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Building2, Smartphone, Wallet, QrCode, ArrowRight } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';

// Payment method options with icons and descriptions
const PAYMENT_METHODS = [
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: Building2,
    description: 'IBAN, SWIFT, or local bank',
    placeholder: 'IBAN: NL91ABNA0417164300',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    fields: [
      { name: 'account_name', label: 'Account Name', placeholder: 'John Doe' },
      { name: 'iban', label: 'IBAN / Account Number', placeholder: 'NL91ABNA0417164300' },
      { name: 'bank_name', label: 'Bank Name (optional)', placeholder: 'ABN AMRO', required: false },
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
      </svg>
    ),
    description: 'Fast & secure payments',
    placeholder: 'john@email.com',
    color: 'from-[#003087] to-[#009cde]',
    bgColor: 'bg-[#003087]/10',
    borderColor: 'border-[#003087]/30',
    fields: [
      { name: 'paypal_email', label: 'PayPal Email', placeholder: 'your@email.com' },
    ]
  },
  {
    id: 'revolut',
    name: 'Revolut',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M20.155 3.066a2.965 2.965 0 0 0-2.1-.866H5.945a2.965 2.965 0 0 0-2.966 2.966v13.668a2.965 2.965 0 0 0 2.966 2.966h12.11a2.965 2.965 0 0 0 2.966-2.966V5.166c0-.79-.314-1.548-.866-2.1zM12 18.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    description: 'Instant transfers',
    placeholder: '@johndoe',
    color: 'from-[#0666eb] to-[#00d4aa]',
    bgColor: 'bg-[#0666eb]/10',
    borderColor: 'border-[#0666eb]/30',
    fields: [
      { name: 'revolut_tag', label: 'Revolut Tag', placeholder: '@yourusername' },
    ]
  },
  {
    id: 'wise',
    name: 'Wise',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12.5 2L2 9l4 3v8l6.5-5L19 20v-8l4-3-10.5-7zM12.5 5.5L18 9l-5.5 4L7 9l5.5-3.5z"/>
      </svg>
    ),
    description: 'Low fee international',
    placeholder: 'your@email.com',
    color: 'from-[#9fe870] to-[#00b9ff]',
    bgColor: 'bg-[#9fe870]/10',
    borderColor: 'border-[#9fe870]/30',
    fields: [
      { name: 'wise_email', label: 'Wise Email', placeholder: 'your@email.com' },
    ]
  },
  {
    id: 'venmo',
    name: 'Venmo',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zM16.5 8.5c-.28 1.14-.9 2.8-1.5 3.8l-2.14 3.7c-.5.86-1 1.5-1.86 1.5H8.5c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h2.5c.55 0 1 .45 1 1v3l1.5-3c.28-.56.72-1 1.5-1h1c.55 0 .78.45.5 1z"/>
      </svg>
    ),
    description: 'US mobile payments',
    placeholder: '@johndoe',
    color: 'from-[#3d95ce] to-[#008cff]',
    bgColor: 'bg-[#3d95ce]/10',
    borderColor: 'border-[#3d95ce]/30',
    fields: [
      { name: 'venmo_username', label: 'Venmo Username', placeholder: '@yourusername' },
    ]
  },
  {
    id: 'other',
    name: 'Other',
    icon: Wallet,
    description: 'Custom payment method',
    placeholder: 'Describe your payment method...',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    fields: [
      { name: 'custom_instructions', label: 'Payment Instructions', placeholder: 'Enter your payment details...', multiline: true },
    ]
  },
];

export default function PaymentMethodSelector({ value, onChange, className = '' }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formData, setFormData] = useState({});

  // Parse existing value to detect method type
  React.useEffect(() => {
    if (value && !selectedMethod) {
      // Try to auto-detect method from existing value
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('iban') || lowerValue.includes('bank')) {
        setSelectedMethod('bank_transfer');
      } else if (lowerValue.includes('paypal')) {
        setSelectedMethod('paypal');
      } else if (lowerValue.includes('revolut')) {
        setSelectedMethod('revolut');
      } else if (lowerValue.includes('wise')) {
        setSelectedMethod('wise');
      } else if (lowerValue.includes('venmo')) {
        setSelectedMethod('venmo');
      }
    }
  }, [value, selectedMethod]);

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setFormData({});
    // Clear the value when changing methods
    onChange('');
  };

  const handleFieldChange = (fieldName, fieldValue) => {
    const newFormData = { ...formData, [fieldName]: fieldValue };
    setFormData(newFormData);

    // Generate payment instructions from form data
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (method) {
      let instructions = '';
      if (selectedMethod === 'bank_transfer') {
        const parts = [];
        if (newFormData.iban) parts.push(`IBAN: ${newFormData.iban}`);
        if (newFormData.account_name) parts.push(`Name: ${newFormData.account_name}`);
        if (newFormData.bank_name) parts.push(`Bank: ${newFormData.bank_name}`);
        instructions = parts.join('\n');
      } else if (selectedMethod === 'paypal') {
        instructions = newFormData.paypal_email ? `PayPal: ${newFormData.paypal_email}` : '';
      } else if (selectedMethod === 'revolut') {
        instructions = newFormData.revolut_tag ? `Revolut: ${newFormData.revolut_tag}` : '';
      } else if (selectedMethod === 'wise') {
        instructions = newFormData.wise_email ? `Wise: ${newFormData.wise_email}` : '';
      } else if (selectedMethod === 'venmo') {
        instructions = newFormData.venmo_username ? `Venmo: ${newFormData.venmo_username}` : '';
      } else if (selectedMethod === 'other') {
        instructions = newFormData.custom_instructions || '';
      }
      onChange(instructions);
    }
  };

  const selectedMethodData = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Method Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <motion.button
              key={method.id}
              type="button"
              onClick={() => handleMethodSelect(method.id)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected
                  ? `${method.borderColor} ${method.bgColor} border-opacity-100`
                  : 'border-dark-border bg-dark-card/50 hover:border-white/20 hover:bg-dark-elevated/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-success-muted rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${method.color}`}>
                  {typeof Icon === 'function' ? <Icon /> : <Icon className="w-5 h-5 text-white" />}
                </div>
              </div>
              <p className="font-semibold text-white text-sm">{method.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{method.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Method Form */}
      {selectedMethodData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${selectedMethodData.borderColor} ${selectedMethodData.bgColor} space-y-4`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedMethodData.color}`}>
              {typeof selectedMethodData.icon === 'function'
                ? <selectedMethodData.icon />
                : <selectedMethodData.icon className="w-5 h-5 text-white" />
              }
            </div>
            <div>
              <p className="font-semibold text-white">{selectedMethodData.name}</p>
              <p className="text-xs text-gray-400">Enter your payment details below</p>
            </div>
          </div>

          {selectedMethodData.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="text-gray-300 text-sm">{field.label} {field.required !== false && '*'}</Label>
              {field.multiline ? (
                <textarea
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  rows={3}
                  className="w-full bg-dark-primary border border-dark-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
                  required={field.required !== false}
                />
              ) : (
                <Input
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="bg-dark-primary border-dark-border text-white"
                  required={field.required !== false}
                />
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Preview */}
      {value && (
        <div className="p-3 rounded-lg bg-dark-elevated border border-dark-border">
          <p className="text-xs text-gray-500 mb-1">Payer will see:</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{value}</p>
        </div>
      )}
    </div>
  );
}
