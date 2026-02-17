// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
// import Link from 'next/link';

// // ✅ HELPER FUNCTION #1: Create valid date from form inputs
// function createEventDate(dateStr: string, timeStr: string): Date | null {
//   if (!dateStr) return null;
  
//   try {
//     // Ensure date format is YYYY-MM-DD
//     if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
//       console.error('Invalid date format:', dateStr);
//       return null;
//     }
    
//     const [year, month, day] = dateStr.split('-').map(Number);
//     const [hours, minutes] = (timeStr || '12:00').split(':').map(Number);
    
//     // Create date (months are 0-indexed in JS)
//     const date = new Date(year, month - 1, day, hours, minutes);
    
//     // Validate
//     if (isNaN(date.getTime())) {
//       console.error('Invalid date object created');
//       return null;
//     }
    
//     return date;
//   } catch (e) {
//     console.error('Error creating date:', e);
//     return null;
//   }
// }

// // ✅ HELPER FUNCTION #2: Format date for display
// function formatDateForInput(date: Date): string {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// // ✅ HELPER FUNCTION #3: Format time for display
// function formatTimeForInput(date: Date): string {
//   const hours = String(date.getHours()).padStart(2, '0');
//   const minutes = String(date.getMinutes()).padStart(2, '0');
//   return `${hours}:${minutes}`;
// }

// export default function CreateEventPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
  
//   // Set default date to tomorrow
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);
  
//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     date: formatDateForInput(tomorrow),
//     time: formatTimeForInput(tomorrow),
//     location: '',
//     imageUrl: '',
//     published: true,
//     isFeatured: false
//   });

//   const [tickets, setTickets] = useState([
//     { type: 'Regular', price: 50, quantity: 100 }
//   ]);

//   // Simulate image upload - in production, use Cloudinary, UploadThing, etc.
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const result = reader.result as string;
//         setImagePreview(result);
//         // For demo, store as base64 - in production, upload to cloud storage
//         setForm({ ...form, imageUrl: result });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeImage = () => {
//     setImagePreview(null);
//     setForm({ ...form, imageUrl: '' });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // ✅ USE HELPER FUNCTION #1
//       const eventDate = createEventDate(form.date, form.time);
      
//       // Validate date
//       if (!eventDate) {
//         alert('Please enter a valid date and time (YYYY-MM-DD format)');
//         setLoading(false);
//         return;
//       }

//       // Check if date is in the past
//       const now = new Date();
//       now.setHours(0, 0, 0, 0);
//       const compareDate = new Date(eventDate);
//       compareDate.setHours(0, 0, 0, 0);
      
//       if (compareDate < now) {
//         alert('Event date cannot be in the past');
//         setLoading(false);
//         return;
//       }

//       console.log('✅ Submitting event:', {
//         title: form.title,
//         date: eventDate.toISOString(),
//         location: form.location,
//         tickets: tickets.length
//       });

//       // ✅ Prepare request body
//       const requestBody = {
//         title: form.title,
//         description: form.description || '',
//         date: eventDate.toISOString(), // ✅ Send as ISO string
//         location: form.location,
//         imageUrl: form.imageUrl || null,
//         published: form.published,
//         isFeatured: form.isFeatured,
//         tickets: tickets.map(t => ({
//           type: t.type,
//           price: t.price,
//           quantity: t.quantity
//         }))
//       };

//       const res = await fetch('/api/admin/events', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(requestBody),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         console.error('❌ Server error:', data);
//         throw new Error(data.error || data.details || 'Failed to create event');
//       }

//       console.log('✅ Event created:', data);
      
//       // Show success message
//       alert('Event created successfully!');
      
//       // Redirect to events list
//       router.push('/admin/events');
//       router.refresh();
      
//     } catch (err) {
//       console.error('❌ Submit error:', err);
//       alert(err instanceof Error ? err.message : 'Failed to create event. Check console for details.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="mb-6">
//           <Link href="/admin/events" className="flex items-center gap-2 text-slate-600 hover:text-brand-primary">
//             <ArrowLeft className="w-5 h-5" /> Back to Events
//           </Link>
//         </div>

//         <div className="bg-white rounded-2xl shadow-lg p-8">
//           <h1 className="text-3xl font-bold text-slate-900 mb-8">Create New Event</h1>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Image Upload Section */}
//             <div>
//               <label className="block font-medium text-slate-900 mb-2">
//                 Event Image
//               </label>
//               <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-brand-primary transition-colors relative">
//                 {!imagePreview ? (
//                   <div>
//                     <div className="flex justify-center mb-4">
//                       <div className="p-3 bg-slate-100 rounded-full">
//                         <Upload className="w-6 h-6 text-slate-500" />
//                       </div>
//                     </div>
//                     <p className="text-sm text-slate-600 mb-2">
//                       Drag and drop or click to upload
//                     </p>
//                     <p className="text-xs text-slate-500">
//                       PNG, JPG, GIF up to 10MB
//                     </p>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                     />
//                   </div>
//                 ) : (
//                   <div className="relative">
//                     <div className="relative h-48 w-full rounded-lg overflow-hidden">
//                       <img 
//                         src={imagePreview} 
//                         alt="Preview" 
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                     <button
//                       type="button"
//                       onClick={removeImage}
//                       className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Event Title */}
//             <div>
//               <label className="block font-medium text-slate-900 mb-2">
//                 Event Title <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 value={form.title}
//                 onChange={(e) => setForm({...form, title: e.target.value})}
//                 className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
//                 placeholder="e.g., Miss Liberia 2025"
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block font-medium text-slate-900 mb-2">
//                 Description
//               </label>
//               <textarea
//                 rows={4}
//                 value={form.description}
//                 onChange={(e) => setForm({...form, description: e.target.value})}
//                 className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
//                 placeholder="Describe your event..."
//               />
//             </div>

//             {/* Date and Time */}
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block font-medium text-slate-900 mb-2">
//                   Date <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   required
//                   value={form.date}
//                   onChange={(e) => setForm({...form, date: e.target.value})}
//                   className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
//                   min={formatDateForInput(new Date())}
//                 />
//               </div>
//               <div>
//                 <label className="block font-medium text-slate-900 mb-2">
//                   Time <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="time"
//                   required
//                   value={form.time}
//                   onChange={(e) => setForm({...form, time: e.target.value})}
//                   className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
//                 />
//               </div>
//             </div>

//             {/* Location */}
//             <div>
//               <label className="block font-medium text-slate-900 mb-2">
//                 Location <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 value={form.location}
//                 onChange={(e) => setForm({...form, location: e.target.value})}
//                 className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
//                 placeholder="e.g., SKD Stadium, Monrovia"
//               />
//             </div>

//             {/* Tickets Section */}
//             <div className="border-t border-slate-200 pt-6">
//               <h2 className="text-xl font-bold text-slate-900 mb-4">Ticket Types</h2>
              
//               {tickets.map((ticket, index) => (
//                 <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
//                   <div className="col-span-5">
//                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                       Type
//                     </label>
//                     <input
//                       type="text"
//                       value={ticket.type}
//                       onChange={(e) => {
//                         const newTickets = [...tickets];
//                         newTickets[index].type = e.target.value;
//                         setTickets(newTickets);
//                       }}
//                       className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
//                       placeholder="e.g., VIP"
//                       required
//                     />
//                   </div>
//                   <div className="col-span-3">
//                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                       Price (LRD)
//                     </label>
//                     <input
//                       type="number"
//                       value={ticket.price}
//                       onChange={(e) => {
//                         const newTickets = [...tickets];
//                         newTickets[index].price = parseFloat(e.target.value);
//                         setTickets(newTickets);
//                       }}
//                       className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
//                       min="0"
//                       step="0.01"
//                       required
//                     />
//                   </div>
//                   <div className="col-span-3">
//                     <label className="block text-sm font-medium text-slate-700 mb-1">
//                       Quantity
//                     </label>
//                     <input
//                       type="number"
//                       value={ticket.quantity}
//                       onChange={(e) => {
//                         const newTickets = [...tickets];
//                         newTickets[index].quantity = parseInt(e.target.value);
//                         setTickets(newTickets);
//                       }}
//                       className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
//                       min="1"
//                       required
//                     />
//                   </div>
//                   <div className="col-span-1">
//                     {tickets.length > 1 && (
//                       <button
//                         type="button"
//                         onClick={() => {
//                           const newTickets = tickets.filter((_, i) => i !== index);
//                           setTickets(newTickets);
//                         }}
//                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
//                       >
//                         <Trash2 className="w-5 h-5" />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}

//               <button
//                 type="button"
//                 onClick={() => setTickets([...tickets, { type: 'VIP', price: 100, quantity: 50 }])}
//                 className="flex items-center gap-2 text-brand-primary font-medium hover:text-brand-accent"
//               >
//                 <Plus className="w-5 h-5" />
//                 Add Ticket Type
//               </button>
//             </div>

//             {/* Event Options */}
//             <div className="border-t border-slate-200 pt-6">
//               <div className="flex items-center gap-6">
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     checked={form.published}
//                     onChange={(e) => setForm({...form, published: e.target.checked})}
//                     className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
//                   />
//                   <span className="text-sm text-slate-700">Publish immediately</span>
//                 </label>
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     checked={form.isFeatured}
//                     onChange={(e) => setForm({...form, isFeatured: e.target.checked})}
//                     className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
//                   />
//                   <span className="text-sm text-slate-700">Feature this event</span>
//                 </label>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <div className="pt-6">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-bold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//               >
//                 {loading ? 'Creating Event...' : 'Create Event'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import EventForm from "components/admin/EventForm";

export default async function CreateEventPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create a new event. Set Published = ON to show on homepage.
        </p>
      </div>
      
      <EventForm />
    </div>
  );
}