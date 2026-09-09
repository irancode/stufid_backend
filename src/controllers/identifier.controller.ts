import { NOT_FOUND, OK } from "../constant/http";
import catchErrors from "../utils/catchErrors";
import AppError from "../utils/AppError";
import {
    getIdentifierByIdentifierId,
    getIdentifierList,
} from "../services/identifier.service";
import {
    identifierIdParamSchema,
    listIdentifiersSchema,
} from "../validations/identifier.validator";
import { parseBody } from "../utils/helpers";

export const index = catchErrors(async (req, res) => {
    const query = parseBody(listIdentifiersSchema, req.query);
    const data = await getIdentifierList(query);

    res.status(OK).json({
        result: "success",
        message: "Identifiers",
        data,
    });
});

export const show = catchErrors(async (req, res) => {
    const rawId = req.params.identifier_id;
    const { identifier_id } = parseBody(identifierIdParamSchema, {
        identifier_id: Array.isArray(rawId) ? rawId[0] : rawId,
    });
    const data = await getIdentifierByIdentifierId(identifier_id);

    if (!data) {
        throw new AppError(NOT_FOUND, "Identifier not found", 4004);
    }

    res.status(OK).json({
        result: "success",
        message: "Identifier",
        data,
    });
});
