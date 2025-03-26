const getColorForChannel = (index: number) => {
    const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#f57c00', '#6a1b9a', '#0097a7'];
    return colors[index % colors.length];
  };