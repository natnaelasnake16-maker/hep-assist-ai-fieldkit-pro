/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AssistantPage from './pages/AssistantPage';
import CaseIntakePage from './pages/CaseIntakePage';
import ProtocolSearchPage from './pages/ProtocolSearchPage';
import SupervisorReviewPage from './pages/SupervisorReviewPage';
import FieldFeedbackPage from './pages/FieldFeedbackPage';
import EvaluationPage from './pages/EvaluationPage';
import MetricsPage from './pages/MetricsPage';
import ModelOpsPage from './pages/ModelOpsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import OfflineCenterPage from './pages/OfflineCenterPage';
import SettingsPage from './pages/SettingsPage';
import { getAppPrefs, subscribeToStateChanges } from './services/api';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('assistant');
  const [prefs, setPrefs] = useState(getAppPrefs());

  useEffect(() => {
    // Sync active settings state
    const unsubscribe = subscribeToStateChanges(() => {
      setPrefs(getAppPrefs());
    });
    return unsubscribe;
  }, []);

  // Helper mapping tabs to their specific file pages
  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'assistant':
        return <AssistantPage />;
      case 'intake':
        return <CaseIntakePage setActiveTab={setActiveTab} />;
      case 'protocols':
        return <ProtocolSearchPage setActiveTab={setActiveTab} />;
      case 'review':
        return <SupervisorReviewPage />;
      case 'feedback':
        return <FieldFeedbackPage />;
      case 'evaluation':
        return <EvaluationPage />;
      case 'metrics':
        return <MetricsPage />;
      case 'modelops':
        return <ModelOpsPage />;
      case 'integrations':
        return <IntegrationsPage />;
      case 'offline':
        return <OfflineCenterPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AssistantPage />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100">
      
      {/* Top command control bar */}
      <Header />

      {/* Main viewport containing left sidebar and the page canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* Navigation panel */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentRole={prefs.role} 
        />

        {/* Action Page Component */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          
          {/* Warn supervisors if viewing restricted panel under a different role */}
          {(activeTab === 'review' && prefs.role === 'HEW') && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center gap-2 font-medium shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Permission Note: You are currently viewing the Supervisor Review list. HEW roles normally have write-only intake access.</span>
            </div>
          )}

          {/* Subscribed Page component */}
          {renderCurrentPage()}
          
        </main>

      </div>
    </div>
  );
}
