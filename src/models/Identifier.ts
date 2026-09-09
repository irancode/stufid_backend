import { Sequelize } from "sequelize";

const Identifier = (sequelize: Sequelize, DataTypes: any) => {
    const Identifier = sequelize.define(
        "Identifier",
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
            description_of_id: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            taxable: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            vat: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            origin_type: {
                type: DataTypes.ENUM("وارداتی", "تولید داخل"),
                allowNull: true,
                defaultValue: "وارداتی",
            },
            identifier_id_ref: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                references: {
                    model: "identifier_ids",
                    key: "id",
                },
            },
        },
        {
            tableName: "identifiers",
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
        },
    );

   

    // Identifier.prototype.toJSON = function () {
    //     const values = { ...this.get() };
    //     delete values.id;
    //     values.id = values.identifier_id;
    //     delete values.identifier_id;
    //     return values;
    // };

    return Identifier;
};

export default Identifier;
