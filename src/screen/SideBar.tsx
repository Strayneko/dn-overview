import { Grid, Layout } from "antd";
import {
  Gem,
  Home,
  LayoutGrid,
  Map,
  Settings,
  Shield,
  Sparkles,
  Star,
  Swords,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { LS_KEYS } from "../constants/localStorage.constants";
import { TAB_GROUP_LIST } from "../constants/Common.constants";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  setIsCollapsedSideBar,
  setSelectedSideBar,
} from "../slice/UIState.reducer";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const GROUP_ICONS: Record<string, React.ElementType> = {
  MAIN: Home,
  STAGE: Map,
  EQUIPMENT: Shield,
  JADE: Gem,
  HERALDRY: Star,
  TALISMAN: Sparkles,
  MISC: LayoutGrid,
  UTILITY: Settings,
};

const SideBar = () => {
  const dispatch = useAppDispatch();
  const screens = useBreakpoint();

  const selectedSideBar = useAppSelector(
    (state) => state.UIState.selectedSideBar
  );
  const isCollapsedSideBar = useAppSelector(
    (state) => state.UIState.isCollapsedSideBar
  );
  const isKeepScreen = useAppSelector((state) => state.UIState.isKeepScreen);

  const [isSmall, setIsSmall] = useState(false);

  const iscollapsed = useMemo(
    () => (isSmall ? isCollapsedSideBar : false),
    [isCollapsedSideBar, isSmall]
  );

  const setCollapse = (flag: boolean) => {
    if (isSmall) dispatch(setIsCollapsedSideBar(flag));
  };

  return (
    <Sider
      breakpoint="md"
      collapsedWidth="0"
      onBreakpoint={(broken) => setIsSmall(broken)}
      onCollapse={(collapsed, type) => {
        if (type === "clickTrigger" || type === "responsive") {
          dispatch(setIsCollapsedSideBar(collapsed));
        }
      }}
      collapsed={iscollapsed}
      width={screens.xs ? 216 : 240}
      tabIndex={0}
      onBlur={() => setCollapse(true)}
      onFocus={() => setCollapse(false)}
      style={{
        background: "var(--sidebar)",
        ...(isSmall
          ? { position: "fixed", zIndex: 100, height: "100%" }
          : undefined),
      }}
    >
      <div className="flex flex-col h-full border-r border-sidebar-border overflow-hidden">

        {/* ── Brand ── */}
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-[14px] border-b border-sidebar-border">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 shrink-0">
            <Swords size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">
              DN Overview
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-none">
              Dragon Nest SEA
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
          {TAB_GROUP_LIST.map((group) => {
            const GroupIcon = GROUP_ICONS[group.key] ?? LayoutGrid;

            return (
              <div key={group.key}>
                {/* Group label */}
                <div className="flex items-center gap-1.5 px-2 mb-1 select-none">
                  <GroupIcon
                    size={10}
                    className="text-muted-foreground/50 shrink-0"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
                    {group.name}
                  </span>
                </div>

                {/* Nav items */}
                <div className="space-y-0.5">
                  {group.children.map((item) => {
                    const isActive = selectedSideBar.key === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          dispatch(setSelectedSideBar(item));
                          if (isKeepScreen) {
                            localStorage.setItem(
                              LS_KEYS.last_screen,
                              JSON.stringify(item)
                            );
                          }
                        }}
                        className={cn(
                          "w-full flex items-start gap-2 text-left py-1.5 px-2 rounded-md",
                          "text-sm leading-snug transition-colors duration-100 cursor-pointer",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                      >
                        {/* Active indicator bar */}
                        <span
                          className={cn(
                            "mt-[3px] shrink-0 w-0.5 h-3.5 rounded-full transition-all duration-150",
                            isActive ? "bg-primary" : "bg-transparent"
                          )}
                        />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-sidebar-border px-4 py-2.5">
          <p className="text-[10px] text-muted-foreground/40 text-center select-none">
            DN Overview © 2023 · sam
          </p>
        </div>
      </div>
    </Sider>
  );
};

export default SideBar;
