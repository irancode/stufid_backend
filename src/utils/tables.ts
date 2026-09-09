import Identifier from "../models/Identifier";
import IdentifierId from "../models/IdentifierId";

export const tables = (db: any, sequelize: any, DataTypes: any) => {
    db.Identifier = Identifier(sequelize, DataTypes);
    db.IdentifierId = IdentifierId(sequelize, DataTypes);
};
