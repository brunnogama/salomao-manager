export const RHChartDataLabel = (props: any) => {
    const { x, y, value, fill, position, percent } = props;

    // Explicit positioning logic
    let yOffset = -35 // Default Up (Top)

    if (position === 'bottom') {
        yOffset = 15 // Shift down below the point
    } else {
        yOffset = -35 // Shift up above the point
    }

    let formattedValue = value
    if (typeof value === 'number') {
        formattedValue = Number.isInteger(value) ? value : value.toFixed(1).replace('.', ',')
    }

    return (
        <g>
            <rect
                x={x - 17}
                y={y + yOffset}
                width={34}
                height={18}
                rx={4}
                fill={fill}
            />
            <text
                x={x}
                y={y + yOffset + 12} // Centered in rect
                fill="white"
                textAnchor="middle"
                fontSize="10px"
                fontWeight="bold"
            >
                {formattedValue}{percent ? '%' : ''}
            </text>
        </g>
    );
};
