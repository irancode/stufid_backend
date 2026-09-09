import { Sequelize } from "sequelize";

const IdentifierId = (sequelize: Sequelize, DataTypes: any) => {
    const IdentifierId = sequelize.define(
        "IdentifierId",
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            identifier_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
        },
        {
            tableName: "identifier_ids",
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
            // Indexes are created via: npm run db:indexes
        },
    );

    return IdentifierId;
};

export default IdentifierId;
