export const relations = (db: any) => {
    db.IdentifierId.hasMany(db.Identifier, {
        foreignKey: "identifier_id_ref",
        as: "identifiers",
    });

    db.Identifier.belongsTo(db.IdentifierId, {
        foreignKey: "identifier_id_ref",
        as: "identifierIdRef",
    });
};
