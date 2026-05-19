import { Select, Table } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import ChartsCard, { ChartItem } from "../../components/ChartsCard";
import EquipmentTable from "../../components/EquipmentTable";
import ListingCard from "../../components/ListingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyCommonnStat, TAB_KEY } from "../../constants/Common.constants";
import { EQUIPMENT } from "../../constants/InGame.constants";
import { dataConversionCalculator } from "../../data/ConversionCalculatorData";
import { CommonEquipmentCalculator } from "../../interface/Common.interface";
import { CommonItemStats } from "../../interface/ItemStat.interface";
import {
  combineEqStats,
  getColumnsStats,
  getComparedData,
  getStatDif,
} from "../../utils/common.util";
import { getResource } from "../../utils/resource.util";

// ─── Reference table helper ───────────────────────────────────────────────────

const renderRefTable = (headers: string[], rows: (string | number | undefined | null)[][]) => (
  <div className="overflow-x-auto rounded-md border">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted">
          {headers.map((h) => (
            <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-1.5 tabular-nums">
                {cell === undefined || cell === null
                  ? "-"
                  : typeof cell === "number"
                  ? cell.toLocaleString()
                  : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const getLabel = (item: number) => {
  if (item === 0) return "Buy";
  if (item >= 12) return `Legend +${item - 12}`;
  return `+${item - 1}`;
};

const opt = (start: number, end: number) =>
  Array.from({ length: end + 1 - start }, (_, k) => k + start).map((item) => ({
    label: getLabel(item),
    value: item,
  }));

const CONV_FRAG = 3500;
const WEAP_FRAG = 1;
const EV_AST_STONE = 3;
const EV_AST_POW_ARMOR = 1000;
const EV_AST_POW_WEAP = 1500;
const EV_AST_POW_ACC = 1150;
const EV_AST_POW_WTD = 1300;
const WEAP_ENH_SUC_RATE = [50, 40, 35, 20, 10, 7, 5, 5, 3, 3];
const ENC_AST_POW_ARMOR = 450;
const ENC_AST_STONE_ARMOR = 1;
const ENC_AST_POW_ACC = 500;
const ENC_AST_STONE_ACC = 3;
const ENC_AST_POW_WEAP = 600;
const ENC_AST_STONE_WEAP = 3;
const ENC_AST_POW_WTD = 550;
const ENC_AST_STONE_WTD = 3;

// ─── Component ────────────────────────────────────────────────────────────────

const ConversionContent = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<CommonEquipmentCalculator[]>(dataConversionCalculator);
  const [selectFrom, setSelectFrom] = useState<number>(0);
  const [selectTo, setSelectTo] = useState<number>(1);
  const [selectStat, setSelectStat] = useState<{ label: string; value: string }>();
  const [selectPrev, setSelectPrev] = useState<{ label: string; value: string }>();

  const invalidDtSrc = useMemo(() => {
    let flag = false;
    selectedRowKeys.forEach((item) => {
      const found = dataSource.find((dt) => dt.key === item);
      if (!flag && found && found.to <= found.from) flag = true;
    });
    return flag;
  }, [selectedRowKeys, dataSource]);

  const tableResource = useMemo(() => {
    const temp = {
      "Armor Fragment": 0,
      "Acc Fragment": 0,
      "Wtd Fragment": 0,
      "Weapon Fragment": 0,
      "Astral Powder": 0,
      "Astral Stone": 0,
    };
    if (invalidDtSrc) return temp;

    selectedRowKeys.forEach((item) => {
      const found = dataSource.find((dt) => dt.key === item);
      if (!found) return;
      const { equipment, from, to } = found;
      const isBuy = from === 0;
      const isEnhUnique = to <= 11 && from <= 11;
      const isEvo = to >= 12 && from <= 11;
      const frag =
        (Math.min(to, 11) - Math.max(isEnhUnique ? from : 11, 1)) * CONV_FRAG +
        (isBuy ? CONV_FRAG : 0);
      let lgFrag = 0;
      let lgStone = 0;
      const enhLRange = Math.min(to, 15) - Math.max(from, 1) - (isEvo ? 1 : 0);

      switch (equipment) {
        case EQUIPMENT.HELM:
        case EQUIPMENT.UPPER:
        case EQUIPMENT.LOWER:
        case EQUIPMENT.GLOVE:
        case EQUIPMENT.SHOES:
          temp["Armor Fragment"] += frag;
          if (isEvo) { lgFrag += EV_AST_POW_ARMOR; lgStone += EV_AST_STONE; }
          if (!isEnhUnique) { lgFrag += enhLRange * ENC_AST_POW_ARMOR; lgStone += enhLRange * ENC_AST_STONE_ARMOR; }
          break;
        case EQUIPMENT.MAIN_WEAPON:
        case EQUIPMENT.SECOND_WEAPON:
          if (isEvo) { lgFrag += EV_AST_POW_WEAP; lgStone += EV_AST_STONE; }
          if (!isEnhUnique) { lgFrag += enhLRange * ENC_AST_POW_WEAP; lgStone += enhLRange * ENC_AST_STONE_WEAP; }
          break;
        case EQUIPMENT.NECKLACE:
        case EQUIPMENT.EARRING:
        case EQUIPMENT.RING1:
        case EQUIPMENT.RING2:
          temp["Acc Fragment"] += frag;
          if (isEvo) { lgFrag += EV_AST_POW_ACC; lgStone += EV_AST_STONE; }
          if (!isEnhUnique) { lgFrag += enhLRange * ENC_AST_POW_ACC; lgStone += enhLRange * ENC_AST_STONE_ACC; }
          break;
        case EQUIPMENT.WING:
        case EQUIPMENT.TAIL:
        case EQUIPMENT.DECAL:
          temp["Wtd Fragment"] += frag;
          if (isEvo) { lgFrag += EV_AST_POW_WTD; lgStone += EV_AST_STONE; }
          if (!isEnhUnique) { lgFrag += enhLRange * ENC_AST_POW_WTD; lgStone += enhLRange * ENC_AST_STONE_WTD; }
          break;
        default:
          break;
      }
      temp["Astral Powder"] += lgFrag;
      temp["Astral Stone"] += lgStone;
    });

    return temp;
  }, [selectedRowKeys, dataSource, invalidDtSrc]);

  const statDif: CommonItemStats = useMemo(() => {
    let temp: CommonItemStats = { ...EmptyCommonnStat };
    if (invalidDtSrc) return temp;
    selectedRowKeys.forEach((item) => {
      const found = dataSource.find((dt) => dt.key === item);
      if (found) {
        const { equipment, from, to } = found;
        const tableHolder = getResource(TAB_KEY.miscConversion, equipment);
        const { dt1, dt2 } = getComparedData(tableHolder, from, to);
        if (dt2) {
          const dt = dt1 ? combineEqStats(dt2, dt1, "minus") : dt2;
          temp = combineEqStats(temp, dt, "add");
        }
      }
    });
    return temp;
  }, [selectedRowKeys, dataSource, invalidDtSrc]);

  const weaponNotes = useMemo(() => {
    if (invalidDtSrc) return;
    let main: string[] = [];
    let second: string[] = [];
    selectedRowKeys.forEach((item) => {
      const found = dataSource.find((dt) => dt.key === item);
      if (found) {
        const { equipment, from, to } = found;
        const tempSlice = WEAP_ENH_SUC_RATE.slice(Math.max(from, 1) - 1, Math.min(to, 11) - 1);
        if (equipment === EQUIPMENT.MAIN_WEAPON && tempSlice.length) main = tempSlice.map((r) => `${r}%`);
        if (equipment === EQUIPMENT.SECOND_WEAPON && tempSlice.length) second = tempSlice.map((r) => `${r}%`);
      }
    });
    return { main, second };
  }, [selectedRowKeys, dataSource, invalidDtSrc]);

  useEffect(() => {
    const newData = dataSource.map((item) => ({
      ...item,
      from: selectFrom < item.min ? item.min : selectFrom >= item.max ? item.max : selectFrom,
      to: selectTo > item.max ? item.max : selectTo,
    }));
    setDataSource(newData);
  }, [selectFrom, selectTo]);

  const chartItems = useMemo((): ChartItem[] => {
    const stat = selectStat?.value.replace("Desc", "") as keyof CommonItemStats;
    const holder: ChartItem[] = [];
    selectedRowKeys.forEach((item) => {
      const found = dataSource.find((dt) => dt.key === item);
      if (found) {
        const { equipment, from, to } = found;
        const tableHolder = [{ ...EmptyCommonnStat, encLevel: "Buy" }].concat(
          getResource(TAB_KEY.miscConversion, equipment)
        );
        const clippedTable = tableHolder.slice(from, to + 1);
        let prevStatVal = 0;
        clippedTable.forEach((it, idx) => {
          const val = it[stat] !== undefined && typeof it[stat] === "number" ? (it[stat] as number) : 0;
          const dif = idx !== 0 ? val - prevStatVal : 0;
          prevStatVal = val;
          holder.push({ enhance: it.encLevel, total: val, step: dif, type: equipment });
        });
      }
    });
    return holder;
  }, [selectStat, selectedRowKeys, dataSource]);

  const matRows = Object.entries(tableResource).filter(([_, v]) => v !== 0).map(([k, v]) => ({
    mats: k,
    amount: v,
  }));

  return (
    <Tabs defaultValue="calculator" className="space-y-4">
      <TabsList>
        <TabsTrigger value="calculator">Calculator</TabsTrigger>
        <TabsTrigger value="reference">Reference</TabsTrigger>
      </TabsList>

      {/* ── CALCULATOR ── */}
      <TabsContent value="calculator" className="space-y-4">
        {/* Settings bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Quick select</span>
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      { label: "Armor", keys: ["1", "2", "3", "4", "5"] },
                      { label: "Weapon", keys: ["6", "7"] },
                      { label: "Accessories", keys: ["8", "9", "10", "11"] },
                      { label: "WTD", keys: ["12", "13", "14"] },
                    ] as const
                  ).map(({ label, keys }) => (
                    <button
                      key={label}
                      onClick={() => setSelectedRowKeys([...keys])}
                      className={`px-3 py-1 rounded text-sm border transition-colors ${
                        JSON.stringify([...selectedRowKeys].sort()) === JSON.stringify([...keys].sort())
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-5 bg-border hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From</span>
                <Select
                  value={selectFrom}
                  options={opt(0, 15)}
                  onChange={setSelectFrom}
                  style={{ width: 120 }}
                  size="small"
                />
                <span className="text-sm text-muted-foreground">To</span>
                <Select
                  value={selectTo}
                  options={opt(0, 15)}
                  onChange={setSelectTo}
                  style={{ width: 120 }}
                  size="small"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment table */}
        <EquipmentTable
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          dataSource={dataSource}
          setDataSource={setDataSource}
          customLabeling={(item) => getLabel(item)}
        />

        {invalidDtSrc && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            From cannot exceed the To option
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Required Materials</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {matRows.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">Select equipment rows above to see materials.</p>
              ) : (
                <div className="divide-y">
                  {matRows.map((r) => (
                    <div key={r.mats} className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors">
                      <span className="text-sm">{r.mats}</span>
                      <span className="text-sm font-medium tabular-nums">{r.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <ListingCard title="Status Increase" data={getStatDif(statDif)} />
          </div>
        </div>

        {/* Weapon success-rate notes */}
        {((weaponNotes?.main?.length ?? 0) > 0 || (weaponNotes?.second?.length ?? 0) > 0) && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              {(weaponNotes?.main?.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Main Weapon success rate: {weaponNotes!.main.join(", ")}
                </p>
              )}
              {(weaponNotes?.second?.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Second Weapon success rate: {weaponNotes!.second.join(", ")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <ChartsCard
          title="Status Charts"
          data={chartItems}
          statVal={selectStat}
          setStatVal={setSelectStat}
          statPrev={selectPrev}
          setStatPrev={setSelectPrev}
        />
      </TabsContent>

      {/* ── REFERENCE ── */}
      <TabsContent value="reference">
        <Tabs defaultValue="stats-armor" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="stats-armor">Armor Stats</TabsTrigger>
            <TabsTrigger value="stats-weapon">Weapon Stats</TabsTrigger>
            <TabsTrigger value="stats-acc">Accessories Stats</TabsTrigger>
            <TabsTrigger value="stats-wtd">WTD Stats</TabsTrigger>
            <TabsTrigger value="mats">Materials</TabsTrigger>
          </TabsList>

          {/* Armor Stats */}
          <TabsContent value="stats-armor">
            <div className="space-y-4">
              {(
                [
                  { title: "Helm", eq: EQUIPMENT.HELM, cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, strPercentFlag: true, agiPercentFlag: true, intPercentFlag: true, vitPercentFlag: true, hpFlag: true, hpPercentFlag: true } },
                  { title: "Upper", eq: EQUIPMENT.UPPER, cols: { phyMagAtkPercentFlag: true, attAtkPercentFlag: true, crtPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, strPercentFlag: true, agiPercentFlag: true, intPercentFlag: true, vitPercentFlag: true, hpFlag: true, hpPercentFlag: true } },
                  { title: "Lower", eq: EQUIPMENT.LOWER, cols: { phyMagAtkPercentFlag: true, attAtkPercentFlag: true, crtPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, hpFlag: true, hpPercentFlag: true } },
                  { title: "Glove", eq: EQUIPMENT.GLOVE, cols: { phyMagAtkPercentFlag: true, attAtkPercentFlag: true, crtPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, hpFlag: true, hpPercentFlag: true } },
                  { title: "Shoes", eq: EQUIPMENT.SHOES, cols: { phyMagAtkPercentFlag: true, attAtkPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, strPercentFlag: true, agiPercentFlag: true, intPercentFlag: true, vitPercentFlag: true, hpFlag: true, hpPercentFlag: true, moveSpeedPercentFlag: true } },
                ] as const
              ).map(({ title, eq, cols }) => (
                <div key={title}>
                  <p className="text-sm font-semibold mb-2">{title}</p>
                  <div className="overflow-x-auto rounded-md border">
                    <Table
                      size="small"
                      dataSource={getResource(TAB_KEY.miscConversion, eq)}
                      columns={getColumnsStats(cols)}
                      pagination={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Weapon Stats */}
          <TabsContent value="stats-weapon">
            <div className="space-y-4">
              {(
                [
                  { title: "Main Weapon", eq: EQUIPMENT.MAIN_WEAPON, cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, attAtkPercentFlag: true, crtFlag: true, crtPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, cdmFlag: true } },
                  { title: "Second Weapon", eq: EQUIPMENT.SECOND_WEAPON, cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, attAtkPercentFlag: true, cdmFlag: true, fdFlag: true, crtFlag: true } },
                ] as const
              ).map(({ title, eq, cols }) => (
                <div key={title}>
                  <p className="text-sm font-semibold mb-2">{title}</p>
                  <div className="overflow-x-auto rounded-md border">
                    <Table
                      size="small"
                      dataSource={getResource(TAB_KEY.miscConversion, eq)}
                      columns={getColumnsStats(cols)}
                      pagination={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Accessories Stats */}
          <TabsContent value="stats-acc">
            <div className="space-y-4">
              {(
                [
                  { title: "Necklace", eq: EQUIPMENT.NECKLACE, cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, attAtkPercentFlag: true, cdmFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, defFlag: true, magdefFlag: true } },
                  { title: "Earring", eq: EQUIPMENT.EARRING, cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, attAtkPercentFlag: true, crtFlag: true, crtPercentFlag: true, cdmFlag: true, fdFlag: true, hpFlag: true, hpPercentFlag: true } },
                  { title: "Ring", eq: EQUIPMENT.RING1, cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, attAtkPercentFlag: true, crtFlag: true, cdmFlag: true, fdFlag: true } },
                ] as const
              ).map(({ title, eq, cols }) => (
                <div key={title}>
                  <p className="text-sm font-semibold mb-2">{title}</p>
                  <div className="overflow-x-auto rounded-md border">
                    <Table
                      size="small"
                      dataSource={getResource(TAB_KEY.miscConversion, eq)}
                      columns={getColumnsStats(cols)}
                      pagination={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* WTD Stats */}
          <TabsContent value="stats-wtd">
            <div className="space-y-4">
              {(
                [
                  { title: "Wing", eq: EQUIPMENT.WING, note: "*Legend stats based on KDN patch note", cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, crtFlag: true, cdmFlag: true, fdFlag: true, vitFlag: true, moveSpeedPercentFlag: true, moveSpeedPercentTownFlag: true } },
                  { title: "Tail", eq: EQUIPMENT.TAIL, note: "*Legend stats based on KDN patch note", cols: { phyMagAtkFlag: true, phyMagAtkPercentFlag: true, attAtkPercentFlag: true, fdFlag: true, strFlag: true, agiFlag: true, intFlag: true, vitFlag: true, defPercentFlag: true, magdefPercentFlag: true } },
                  { title: "Decal", eq: EQUIPMENT.DECAL, note: "*Legend stats based on KDN patch note", cols: { phyMagAtkFlag: true, attAtkPercentFlag: true, crtFlag: true, crtPercentFlag: true, cdmFlag: true, fdFlag: true, defFlag: true, magdefFlag: true, defPercentFlag: true, magdefPercentFlag: true } },
                ] as const
              ).map(({ title, eq, note, cols }) => (
                <div key={title}>
                  <p className="text-sm font-semibold mb-2">
                    {title}
                    {note && <span className="ml-2 text-xs font-normal text-muted-foreground italic">{note}</span>}
                  </p>
                  <div className="overflow-x-auto rounded-md border">
                    <Table
                      size="small"
                      dataSource={getResource(TAB_KEY.miscConversion, eq)}
                      columns={getColumnsStats(cols)}
                      pagination={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Materials */}
          <TabsContent value="mats">
            <div className="space-y-6">
              {/* Armor */}
              <div>
                <p className="text-sm font-semibold mb-3">Armor</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement — uses Armor Fragment</p>
                    {renderRefTable(["Action", "Amount"], [
                      ["Buy from Store", CONV_FRAG],
                      ["Every tap +0 → +10", CONV_FRAG],
                    ])}
                    <p className="text-xs text-muted-foreground mt-1 italic">* +1 to +10 have 100% success rate</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Evo to Legend</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", EV_AST_POW_ARMOR],
                      ["Astral Stone", EV_AST_STONE],
                    ])}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement Legend (per tap)</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", ENC_AST_POW_ARMOR],
                      ["Astral Stone", ENC_AST_STONE_ARMOR],
                    ])}
                  </div>
                </div>
              </div>

              {/* Weapon */}
              <div>
                <p className="text-sm font-semibold mb-3">Weapon</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement — uses Weapon Fragment</p>
                    {renderRefTable(["Action", "Amount"], [
                      ["Every tap +0 → +10", WEAP_FRAG],
                    ])}
                    <p className="text-xs text-muted-foreground mt-1 italic">* Buy Conversion Weapon box via Trading House or Cherry Store</p>
                    <p className="text-xs text-muted-foreground italic">Success rate: {WEAP_ENH_SUC_RATE.map((r) => `${r}%`).join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Evo to Legend</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", EV_AST_POW_WEAP],
                      ["Astral Stone", EV_AST_STONE],
                    ])}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement Legend (per tap)</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", ENC_AST_POW_WEAP],
                      ["Astral Stone", ENC_AST_STONE_WEAP],
                    ])}
                  </div>
                </div>
              </div>

              {/* Accessories */}
              <div>
                <p className="text-sm font-semibold mb-3">Accessories</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement — uses Acc Fragment</p>
                    {renderRefTable(["Action", "Amount"], [
                      ["Buy from Store", CONV_FRAG],
                      ["Every tap +0 → +10", CONV_FRAG],
                    ])}
                    <p className="text-xs text-muted-foreground mt-1 italic">* +1 to +10 have 100% success rate</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Evo to Legend</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", EV_AST_POW_ACC],
                      ["Astral Stone", EV_AST_STONE],
                    ])}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement Legend (per tap)</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", ENC_AST_POW_ACC],
                      ["Astral Stone", ENC_AST_STONE_ACC],
                    ])}
                  </div>
                </div>
              </div>

              {/* WTD */}
              <div>
                <p className="text-sm font-semibold mb-3">WTD (Wing / Tail / Decal)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement — uses Wtd Fragment</p>
                    {renderRefTable(["Action", "Amount"], [
                      ["Buy from Store", CONV_FRAG],
                      ["Every tap +0 → +10", CONV_FRAG],
                    ])}
                    <p className="text-xs text-muted-foreground mt-1 italic">* +1 to +10 have 100% success rate</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Evo to Legend</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", EV_AST_POW_WTD],
                      ["Astral Stone", EV_AST_STONE],
                    ])}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enhancement Legend (per tap)</p>
                    {renderRefTable(["Material", "Amount"], [
                      ["Astral Powder", ENC_AST_POW_WTD],
                      ["Astral Stone", ENC_AST_STONE_WTD],
                    ])}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
};

export default ConversionContent;
