import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TimelineChart({ series }) {
  if (!series || series.length === 0) return null;

  return (
    <div className="bg-surface border border-manilaDark/20 rounded-sm p-4">
      <p className="stamp-text text-inkDim text-xs mb-3 uppercase tracking-wider">
        Spread velocity — new claims per day
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={series}>
          <CartesianGrid stroke="#3a352c" strokeDasharray="2 4" />
          <XAxis dataKey="date" stroke="#A89F88" fontSize={11} />
          <YAxis stroke="#A89F88" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#221F19", border: "1px solid #4a4332", color: "#E8E2D0" }}
          />
          <Line
            type="monotone"
            dataKey="new_claims"
            stroke="#C23B22"
            strokeWidth={2}
            dot={{ fill: "#C23B22", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
