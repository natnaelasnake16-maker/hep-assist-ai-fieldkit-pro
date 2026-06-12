/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  HeartHandshake,
  UserPlus, 
  BookOpen, 
  ShieldCheck, 
  MessageSquare, 
  FileCheck, 
  BarChart3, 
  Cpu, 
  Network, 
  Sliders, 
  WifiOff, 
  ChevronLeft, 
  ChevronRight,
  AlertOctagon,
  FolderLock,
  Workflow,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
}

export default function Sidebar({ activeTab, setActiveTab, currentRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Automatically collapse on smaller displays (tablets/mobile)
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Group items by category for cleaner organization
  const navigationGroups = [
    {
      title: 'Frontline Clinical',
      shortTitle: 'Clinical',
      roles: ['HEW', 'Supervisor', 'MERL', 'AI_Engineer'],
      items: [
        { id: 'assistant', label: 'AI Triage Expert', icon: HeartHandshake, roles: ['HEW', 'Supervisor', 'MERL', 'AI_Engineer'] },
        { id: 'intake', label: 'Structured Intake', icon: UserPlus, roles: ['HEW', 'Supervisor'] },
        { id: 'protocols', label: 'Protocol Guidelines', icon: BookOpen, roles: ['HEW', 'Supervisor', 'MERL', 'AI_Engineer'] },
      ]
    },
    {
      title: 'Clinical Audit & Review',
      shortTitle: 'Audit',
      roles: ['Supervisor', 'AI_Engineer'],
      items: [
        { id: 'review', label: 'Supervisor Review', icon: ShieldCheck, roles: ['Supervisor', 'AI_Engineer'], badge: 'Queue' },
        { id: 'feedback', label: 'Field Feedback Logs', icon: MessageSquare, roles: ['Supervisor', 'MERL', 'AI_Engineer'] },
      ]
    },
    {
      title: 'Operational Analytics',
      shortTitle: 'Metrics',
      roles: ['MERL', 'AI_Engineer'],
      items: [
        { id: 'evaluation', label: 'Judge Evaluation', icon: FileCheck, roles: ['MERL', 'AI_Engineer'], badge: 'LLM' },
        { id: 'metrics', label: 'District Metrics', icon: BarChart3, roles: ['MERL', 'AI_Engineer'] },
      ]
    },
    {
      title: 'Infrastructure Ops',
      shortTitle: 'Config',
      roles: ['AI_Engineer'],
      items: [
        { id: 'modelops', label: 'Model Registry', icon: Cpu, roles: ['AI_Engineer'] },
        { id: 'integrations', label: 'DHIS2 Integration', icon: Network, roles: ['MERL', 'AI_Engineer'] },
      ]
    },
    {
      title: 'Connectivity & Prefs',
      shortTitle: 'State',
      roles: ['HEW', 'Supervisor', 'MERL', 'AI_Engineer'],
      items: [
        { id: 'offline', label: 'Offline Sync Index', icon: WifiOff, roles: ['HEW', 'Supervisor', 'MERL', 'AI_Engineer'] },
        { id: 'settings', label: 'Regional Settings', icon: Sliders, roles: ['HEW', 'Supervisor', 'MERL', 'AI_Engineer'] },
      ]
    }
  ];

  return (
    <aside 
      className={`bg-[#f0f5fa] text-[#1e293b] border-r border-slate-300 flex flex-col transition-all duration-300 relative shrink-0 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 bg-[#1d4ed8] hover:bg-[#172554] text-white rounded-full p-1 border-2 border-[#f0f5fa] cursor-pointer flex items-center justify-center z-40 transition-transform hover:scale-110 shadow-sm"
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Primary Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-5 scrollbar-thin px-3 select-none">
        {navigationGroups.map((group, groupIndex) => {
          // If the current role doesn't have access to this group, check if we should render it
          const isGroupVisibleToRole = group.roles.includes(currentRole);
          
          if (!isGroupVisibleToRole) {
            // Progressive disclosure: hide operational/evaluation screens entirely from Health Extension Workers (HEWs)
            return null;
          }

          return (
            <div key={groupIndex} className="space-y-1">
              {/* Group Title */}
              {!collapsed ? (
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#5c7087] uppercase tracking-wider select-none">
                  {group.title}
                </div>
              ) : (
                <div className="border-t border-slate-300 my-2" />
              )}

              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  const roleHasDirectAccess = item.roles.includes(currentRole);

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors font-sans relative group ${
                        isSelected 
                          ? 'bg-[#1d4ed8] text-white font-semibold shadow-xs' 
                          : 'text-[#475569] hover:bg-[#e1e9f2] hover:text-[#0f172a]'
                      } ${!roleHasDirectAccess ? 'opacity-40 hover:opacity-100' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${isSelected ? 'scale-110 text-white' : 'text-[#64748b] group-hover:text-[#0f172a]'}`} />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate text-xs font-medium">{item.label}</span>
                          
                          {item.badge && (
                            <span className="text-[9px] bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe] px-1.5 py-0.2 rounded-full font-semibold">
                              {item.badge}
                            </span>
                          )}

                          {!roleHasDirectAccess && (
                            <span className="text-[8px] bg-[#f0f4f8] text-[#5c7087] px-1 py-0.2 rounded font-mono font-bold uppercase border border-slate-300 font-mono">
                              Guest
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Const and Locked Safety Disclaimer at base */}
      {!collapsed ? (
        <div className="p-4 bg-[#e6eff9] border-t border-slate-300 text-xs space-y-2">
          <div className="flex gap-2 text-rose-700 font-bold uppercase tracking-wider text-[9px] items-center">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Safety Protocol Active</span>
          </div>
          <p className="leading-relaxed font-sans text-[11px] text-[#475569]">
            This is an offline-ready digital prototype. All AI outputs must be clinically cross-grounded using certified on-device IMNCI guidelines.
          </p>
        </div>
      ) : (
        <div className="p-2.5 text-center bg-[#e6eff9] border-t border-slate-300" title="Safety warning protocol is active">
          <AlertOctagon className="w-5 h-5 text-rose-600 mx-auto" />
        </div>
      )}
    </aside>
  );
}
