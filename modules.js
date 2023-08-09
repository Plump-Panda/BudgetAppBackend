const updateItemInCollection = async (collection, filter, updateItem, options = {}) => {
    try{
        const result = await collection.updateOne(filter, updateItem, options);
        console.log(
            `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
          );
    }catch(err){
        console.log("Error adding access token to user");
    }
    
};

exports.updateItemInCollection = updateItemInCollection;