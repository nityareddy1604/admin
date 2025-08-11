import {DataTypes} from 'sequelize';
import {TABLE_NAMES} from '../../helper/constants.js';

export const formResponseSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    responder_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    form_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.forms,
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    form_response_url: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}
