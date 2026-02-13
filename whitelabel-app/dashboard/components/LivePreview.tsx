'use client';

import { AppConfig } from '../types/config';

interface LivePreviewProps {
  config: AppConfig;
}

export default function LivePreview({ config }: LivePreviewProps) {
  const { appName, brandColors } = config;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Preview</h2>

      {/* Phone Frame */}
      <div className="max-w-sm mx-auto">
        <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
          <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
          <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
          <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
          <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
          
          <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white">
            {/* Status Bar */}
            <div className="h-6 bg-gray-50 flex items-center justify-between px-4 text-xs">
              <span>9:41</span>
              <span>100%</span>
            </div>

            {/* Header */}
            <div 
              className="h-16 flex items-center justify-center"
              style={{ backgroundColor: brandColors.primary }}
            >
              <h1 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
                {appName}
              </h1>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Welcome Card */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-2" style={{ color: brandColors.text }}>
                  Welcome!
                </h2>
                <p className="text-sm text-gray-600">
                  This is how your app will look with these colors.
                </p>
              </div>

              {/* Primary Button */}
              <button
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: brandColors.primary }}
              >
                Primary Button
              </button>

              {/* Secondary Button */}
              <button
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: brandColors.secondary }}
              >
                Secondary Button
              </button>

              {/* Accent Button */}
              <button
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: brandColors.accent }}
              >
                Accent Button
              </button>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: brandColors.primary }}
                  >
                    1,234
                  </div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: brandColors.success }}
                  >
                    89
                  </div>
                  <div className="text-xs text-gray-500">Success</div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: brandColors.accent }}
                  >
                    23
                  </div>
                  <div className="text-xs text-gray-500">New</div>
                </div>
              </div>

              {/* Alert Examples */}
              <div 
                className="p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: brandColors.success + '20',
                  color: brandColors.success
                }}
              >
                Success message example
              </div>

              <div 
                className="p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: brandColors.error + '20',
                  color: brandColors.error
                }}
              >
                Error message example
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around">
              <div className="flex flex-col items-center">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: brandColors.primary }}
                />
                <span className="text-xs mt-1" style={{ color: brandColors.primary }}>
                  Home
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gray-300" />
                <span className="text-xs mt-1 text-gray-500">Search</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gray-300" />
                <span className="text-xs mt-1 text-gray-500">Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Color Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <div 
                className="h-12 rounded-md border border-gray-200"
                style={{ backgroundColor: brandColors.primary }}
              />
              <p className="text-xs text-gray-600 mt-1">Primary</p>
            </div>
            <div>
              <div 
                className="h-12 rounded-md border border-gray-200"
                style={{ backgroundColor: brandColors.secondary }}
              />
              <p className="text-xs text-gray-600 mt-1">Secondary</p>
            </div>
            <div>
              <div 
                className="h-12 rounded-md border border-gray-200"
                style={{ backgroundColor: brandColors.accent }}
              />
              <p className="text-xs text-gray-600 mt-1">Accent</p>
            </div>
            <div>
              <div 
                className="h-12 rounded-md border border-gray-200"
                style={{ backgroundColor: brandColors.success }}
              />
              <p className="text-xs text-gray-600 mt-1">Success</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
