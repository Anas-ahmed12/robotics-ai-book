import React from 'react';
import Layout from '@theme/Layout';

export default function TestTailwind() {
  return (
    <Layout title="Test Tailwind" description="Testing Tailwind CSS integration">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Tailwind CSS Test Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-700 text-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">bg-blue-700</h2>
            <p className="mb-4">This div uses bg-blue-700 class</p>
            <div className="h-4 w-4 bg-white rounded-full mx-auto"></div>
          </div>

          <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">bg-red-500</h2>
            <p className="mb-4">This div uses bg-red-500 class</p>
            <div className="h-4 w-4 bg-white rounded-full mx-auto"></div>
          </div>

          <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">bg-green-500</h2>
            <p className="mb-4">This div uses bg-green-500 class</p>
            <div className="h-4 w-4 bg-white rounded-full mx-auto"></div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded">
            <div className="bg-blue-500 w-8 h-8 rounded"></div>
            <div className="bg-red-500 w-8 h-8 rounded"></div>
            <div className="bg-green-500 w-8 h-8 rounded"></div>
            <div className="bg-yellow-500 w-8 h-8 rounded"></div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded">
            <h3 className="font-bold">Gradient: from-purple-500 to-pink-500</h3>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-center">Utility Classes Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-100 text-blue-800 p-3 rounded text-center">text-blue-800</div>
            <div className="bg-red-100 text-red-800 p-3 rounded text-center">text-red-800</div>
            <div className="bg-green-100 text-green-800 p-3 rounded text-center">text-green-800</div>
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-center">text-yellow-800</div>
          </div>

          <div className="mt-4 flex justify-center space-x-4">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Button 1
            </button>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Button 2
            </button>
            <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
              Button 3
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}