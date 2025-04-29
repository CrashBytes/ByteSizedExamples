"use client";

import { useState, FormEvent } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // In a real application, you would send this data to your API
    console.log("Form submitted:", formData);

    // Simulate API call
    setTimeout(() => {
      setFormStatus({ submitted: true, error: false });
      setFormData({ name: "", email: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>

      {formStatus.submitted ? (
        <div className="max-w-md w-full bg-green-50 border border-green-200 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-green-700 mb-2">
            Message Sent!
          </h2>
          <p className="text-green-600 mb-4">
            Thank you for reaching out. We'll get back to you as soon as
            possible.
          </p>
          <button
            onClick={() => setFormStatus({ submitted: false, error: false })}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email"
                required
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your message"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      )}

      <div className="mt-12 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold mb-4">Other Ways to Reach Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-1">Email</h3>
            <p>info@example.com</p>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-1">Phone</h3>
            <p>+1 (555) 123-4567</p>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-1">Address</h3>
            <p>123 Tech Street, San Francisco, CA 94107</p>
          </div>
        </div>
      </div>
    </div>
  );
}
