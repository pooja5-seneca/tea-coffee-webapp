module.exports = function(sequelize, DataTypes) {

    return sequelize.define('products', {
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, 
            autoIncrement: true 
        },
        product_name: DataTypes.STRING,
        description: DataTypes.STRING, 
        image:DataTypes.STRING, 
        unit_price: DataTypes.FLOAT,
        quantity_in_stock: DataTypes.INTEGER,
        category_id: {
            type: DataTypes.INTEGER,
            foreignKey: true
        },
        bestseller: DataTypes.BOOLEAN,
        discount_percentage: DataTypes.FLOAT
},{
    createdAt: false, // disable createdAt
    updatedAt: false // disable updatedAt
});
}