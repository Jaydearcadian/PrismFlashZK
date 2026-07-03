import React from "react";
import { Terminal } from "lucide-react";

interface DaemonStreamProps {
  solverLogs: any[];
}

export const DaemonStream: React.FC<DaemonStreamProps> = ({ solverLogs }) => {
  return (
    <div className="p-4 bg-white flex flex-col gap-2 flex-1 min-h-[160px]">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
        <h2 className="font-sans font-bold text-xs text-black uppercase tracking-tighter flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#d9a078]" /> 7.0 Solver Daemon Live Activity Stream
        </h2>
        <span className="text-[9px] font-mono text-[#666666]">SECURE TRUSTED ZONE TEE DISPATCHER</span>
      </div>

      <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-none p-3 font-mono text-[10px] h-36 overflow-y-auto space-y-1 flex flex-col-reverse">
        {solverLogs.map((log, index) => {
          let colorClass = "text-black";
          if (log.type === "SUCCESS") colorClass = "text-[#00A86B] font-bold";
          else if (log.type === "ERROR") colorClass = "text-red-600 font-bold";
          else if (log.type === "WARN") colorClass = "text-amber-600";
          else if (log.type === "DAEMON") colorClass = "text-[#d9a078] font-bold";

          return (
            <div key={index} className="flex gap-1.5 items-start leading-relaxed border-b border-[#F0F0F0] pb-1">
              <span className="text-[#999999]">[{log.timestamp}]</span>
               <span className={`px-1 py-0.2 bg-white text-[8px] uppercase border border-[#E5E5E5] ${log.type === "ERROR" ? 'text-red-600 border-red-200' : 'text-[#666666]'}`}>
                {log.type}
              </span>
              <span className={`${colorClass} flex-1`}>{log.message}</span>
            </div>
          );
        })}
        {solverLogs.length === 0 && (
          <div className="text-center text-[#999999] py-8 uppercase text-[9px]">Polling RPC event stream... No events yet.</div>
        )}
      </div>
    </div>
  );
};
