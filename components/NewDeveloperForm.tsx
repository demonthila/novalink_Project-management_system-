import React, { useState } from 'react';

const NewDeveloperForm: React.FC = () => {
  const [form, setForm] = useState({
    full_name: '',
    id_card_number: '',
    address: '',
    personal_email: '',
    company_email: '',
    slack: '',
    skills: '',
    comments: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.id_card_number.trim()) return 'ID card number is required';
    if (!form.company_email.trim()) return 'Company email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.personal_email && !emailRegex.test(form.personal_email)) return 'Personal email is invalid';
    if (!emailRegex.test(form.company_email)) return 'Company email is invalid';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const v = validate();
    if (v) { setMessage({ type: 'error', text: v }); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/add_developer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Developer added successfully (ID: ' + data.id + ')' });
        setForm({ full_name: '', id_card_number: '', address: '', personal_email: '', company_email: '', slack: '', skills: '', comments: '' });
      } else if (data.errors) {
        setMessage({ type: 'error', text: data.errors.join(', ') });
      } else {
        setMessage({ type: 'error', text: data.error || 'Unknown error' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold">New Developer Onboarding</h2>
      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full Legal Name" className="p-3 border rounded" />
        <input name="id_card_number" value={form.id_card_number} onChange={handleChange} placeholder="ID Card Number" className="p-3 border rounded" />
        <input name="personal_email" value={form.personal_email} onChange={handleChange} placeholder="Personal Email" className="p-3 border rounded" />
        <input name="company_email" value={form.company_email} onChange={handleChange} placeholder="Company Email" className="p-3 border rounded" />
        <input name="slack" value={form.slack} onChange={handleChange} placeholder="Tech Slack Username" className="p-3 border rounded" />
        <input name="skills" value={form.skills} onChange={handleChange} placeholder="Skills (comma separated)" className="p-3 border rounded" />
      </div>

      <div>
        <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" className="w-full p-3 border rounded" rows={3} />
      </div>

      <div>
        <textarea name="comments" value={form.comments} onChange={handleChange} placeholder="More Comments" className="w-full p-3 border rounded" rows={3} />
      </div>

      <div className="flex items-center justify-between">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">
          {loading ? 'Saving...' : 'Create Developer'}
        </button>
      </div>
    </form>
  );
};

export default NewDeveloperForm;
