
// Define a "User" model

module.exports = function(sequelize, DataTypes) {

    return sequelize.define('users', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true, 
            autoIncrement: true 
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING, 
        address: DataTypes.STRING,
        email_id: {
            type: DataTypes.STRING,
            unique: true
        },
        pass_word: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        user_created_on: DataTypes.DATE,
        user_role: DataTypes.STRING
},{
    createdAt: false, // disable createdAt
    updatedAt: false // disable updatedAt
});
}
