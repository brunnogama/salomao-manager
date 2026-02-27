export const RHChartPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, fill } = props;

    if (!cx || !cy) return null;

    const RADIAN = Math.PI / 180;
    // Push the label slightly outside the pie
    const x = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const y = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);

    return (
        <g>
            <rect
                x={x - 12}
                y={y - 9}
                width={24}
                height={18}
                rx={4}
                fill={fill} // Use slice color
            />
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10px"
                fontWeight="bold"
            >
                {value}
            </text>
        </g>
    );
};
