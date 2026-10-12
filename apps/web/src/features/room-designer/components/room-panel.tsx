"use client";

import type { Carpet, RoomLayout } from "@farsh/contracts";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { RoomAction } from "../state/room-reducer";
import { ItemsTab } from "./items-tab";
import { RoomTab } from "./room-tab";
import { RugTab } from "./rug-tab";

export type PanelTab = "rug" | "room" | "items";

interface RoomPanelProps {
  layout: RoomLayout;
  carpets: Carpet[];
  carpet: Carpet;
  selectedId: string | null;
  tab: PanelTab;
  paintingImages: Record<string, string>;
  onTab: (tab: PanelTab) => void;
  dispatch: (action: RoomAction) => void;
  onSelect: (id: string | null) => void;
  onPaintingImage: (id: string, file: File | null) => void;
  onFlatten: () => void;
}

/** The mount board beside the room: three tabs, each a task a buyer does in turn. */
export function RoomPanel({ tab, onTab, ...props }: RoomPanelProps) {
  return (
    <Tabs value={tab} onValueChange={(next) => onTab(next as PanelTab)} className="h-full">
      <TabsList aria-label="بخش‌های طراحی">
        <TabsTrigger value="rug">فرش</TabsTrigger>
        <TabsTrigger value="room">اتاق</TabsTrigger>
        <TabsTrigger value="items">وسایل</TabsTrigger>
      </TabsList>
      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
        <TabsContent value="rug">
          <RugTab
            layout={props.layout}
            carpets={props.carpets}
            carpet={props.carpet}
            dispatch={props.dispatch}
            onFlatten={props.onFlatten}
          />
        </TabsContent>
        <TabsContent value="room">
          <RoomTab layout={props.layout} dispatch={props.dispatch} />
        </TabsContent>
        <TabsContent value="items">
          <ItemsTab
            layout={props.layout}
            carpets={props.carpets}
            selectedId={props.selectedId}
            paintingImages={props.paintingImages}
            dispatch={props.dispatch}
            onSelect={props.onSelect}
            onPaintingImage={props.onPaintingImage}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
