import React from "react";

export interface TimelineItem {
    id: string | number;
    title: string;
    description: string;
    time: string;
    icon?: React.ReactNode;
    statusClass?: string;
}

interface ActivityTimelineProps {
    items: TimelineItem[];
    emptyMessage?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
    items,
    emptyMessage = "No recent activity logged."
}) => {
    if (items.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-slate-400 font-medium text-xs uppercase tracking-wider">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {items.map((item, itemIdx) => (
                    <li key={item.id}>
                        <div className="relative pb-8">
                            {itemIdx !== items.length - 1 ? (
                                <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                                    aria-hidden="true"
                                />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${item.statusClass || "bg-sky-50 text-sky-700"}`}>
                                        {item.icon}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">
                                            {item.title}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="text-right whitespace-nowrap text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-0.5">
                                        {item.time}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ActivityTimeline;
