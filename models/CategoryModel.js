module.exports = function(sequelize, DataTypes) {

    return sequelize.define('categories', {
        category_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, 
            autoIncrement: true 
        },
        category_type: DataTypes.STRING
},{
    createdAt: false, // disable createdAt
    updatedAt: false // disable updatedAt
});
}