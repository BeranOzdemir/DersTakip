// Helper to generate consistent colors from names
export const getAvatarColor = (name) => {
    const colors = [
        'bg-ios-blue', 'bg-ios-red', 'bg-ios-green', 'bg-ios-indigo',
        'bg-ios-orange', 'bg-ios-purple', 'bg-ios-teal'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};
