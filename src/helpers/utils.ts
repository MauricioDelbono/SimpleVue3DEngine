const radToDeg = (r: number) => {
    return (r * 180) / Math.PI
}

const degToRad = (d: number) => {
    return (d * Math.PI) / 180
}

export default { radToDeg, degToRad }