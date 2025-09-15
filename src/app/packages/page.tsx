'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Check, Star, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Package {
  id: number;
  name: string;
  price: number;
  gst: number;
  totalPrice: number;
  directCommissionRate: number;
  indirectCommissionRate: number;
  features: string[];
  isPopular?: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchPackages();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data || []);
      } else {
        console.error('Failed to load packages:', data.error);
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: number) => {
    if (!user) {
      toast.error('Please login to purchase a package');
      router.push('/login');
      return;
    }

    setPurchasing(packageId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please login to continue');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          packageId,
          paymentMethod: 'razorpay' // Default payment method
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Package purchased successfully!');
        // Redirect to dashboard or success page
        router.push('/dashboard?tab=packages');
      } else {
        toast.error(data.error || 'Failed to purchase package');
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast.error('Failed to purchase package');
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (packageName: string) => {
    if (packageName.includes('Silver')) return <Star className="w-8 h-8 text-gray-400" />;
    if (packageName.includes('Gold')) return <Zap className="w-8 h-8 text-yellow-500" />;
    if (packageName.includes('Platinum')) return <Crown className="w-8 h-8 text-purple-500" />;
    return <Star className="w-8 h-8 text-gray-400" />;
  };

  const getPackageGradient = (packageName: string) => {
    if (packageName.includes('Silver')) return 'from-gray-50 to-gray-100 border-gray-200';
    if (packageName.includes('Gold')) return 'from-yellow-50 to-orange-100 border-yellow-200';
    if (packageName.includes('Platinum')) return 'from-purple-50 to-indigo-100 border-purple-200';
    return 'from-gray-50 to-gray-100 border-gray-200';
  };

  const getButtonStyle = (packageName: string) => {
    if (packageName.includes('Silver')) return 'bg-gray-600 hover:bg-gray-700 text-white';
    if (packageName.includes('Gold')) return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    if (packageName.includes('Platinum')) return 'bg-purple-600 hover:bg-purple-700 text-white';
    return 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Affiliate Package
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start your affiliate marketing journey with our comprehensive packages. 
            Earn commissions on every referral and build your passive income stream.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-gradient-to-br ${getPackageGradient(pkg.name)} rounded-2xl border-2 p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                pkg.isPopular ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getPackageIcon(pkg.name)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{pkg.totalPrice ? pkg.totalPrice.toLocaleString() : (pkg.price || 0).toLocaleString()}
                  </span>
                  <div className="text-sm text-gray-600 mt-1">
                    Base: ₹{pkg.price ? pkg.price.toLocaleString() : '0'} + GST: ₹{pkg.gst ? pkg.gst.toLocaleString() : '0'}
                  </div>
                </div>
              </div>

              {/* Commission Rates */}
              <div className="bg-white/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Commission Structure</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Direct Referral:</span>
                    <span className="font-semibold text-green-600">{pkg.directCommissionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Indirect Referral:</span>
                    <span className="font-semibold text-green-600">{pkg.indirectCommissionRate || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
                <ul className="space-y-2">
                  {(pkg.features || []).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing === pkg.id}
                className={`w-full ${getButtonStyle(pkg.name)} py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing === pkg.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose Our Affiliate Program?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">High Commissions</h3>
              <p className="text-gray-600">
                Earn up to 20% direct and 12% indirect commissions on every successful referral.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2-Level System</h3>
              <p className="text-gray-600">
                Benefit from a 2-level commission structure that rewards both direct and indirect referrals.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Support</h3>
              <p className="text-gray-600">
                Get dedicated support, marketing materials, and training to maximize your earnings.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of successful affiliates and start building your passive income today.
          </p>
          {!user && (
            <button
              onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200"
            >
              Create Account & Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}