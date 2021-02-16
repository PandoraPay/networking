const { Exception } = PandoraLibrary.helpers;

const NodeTypeEnum = {

    /**
     * Node only for Tunnelling
     */
    nodeTunnel : 1 << 0,

    /**
     * Node used for Consensus
     */
    nodeConsensus : 1 << 1,

    _name: "NodeEum",

};

module.exports = {

    ...NodeTypeEnum,

    combineNodeTypeEnum( value  ){

        if (typeof value === "number")
            value = [value];
        else
        if (Array.isArray(value)){

            const out = {};

            for (let i=0; i < value.length; i++) {

                let foundKey;
                for (const key in NodeTypeEnum)
                    if ( key !== "_name" && NodeTypeEnum[key] === value[i] ) {
                        foundKey = key;
                        break;
                    }

                if (foundKey)
                    out[key] = value[i];
                else
                    throw new Exception(this, "Invalid array value");

            }

            value = out;

        }else
            if (typeof value !== "object" )
                throw new Exception(this, "Invalid value type");

        let number = 0;

        for (const key in value)
            if (key !== "_name" && !NodeTypeEnum[key] )
                throw new Exception(this, "Invalid key value ");
            else
                number |= value[key];

        return number ;

    },

    extractNodeTypeEnum( value ){

        if (value === 0)
            throw new Exception(this, "value should not be 0");

        const out = {};

        for (const key in NodeTypeEnum)

            if ( key !== "_name" && value & (NodeTypeEnum[key]) ) {
                out [key] = NodeTypeEnum[key];
                value ^= NodeTypeEnum[key];
            }

        if (value !== 0)
            throw new Exception(this, "value should be 0");

        return out;

    },

}