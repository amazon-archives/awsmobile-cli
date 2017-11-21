"use strict";

var inquirer = require('inquirer');
var fs = require('fs');
var mhYamlLib = require('./lib/mh-yaml-lib.js');

var userId = {
  name: 'userId',
  type: 'string'
};

let nosqlPartitionKeyLearnMore = 'http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey';
let nosqlIndexLearnMore = 'http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes';

// save project info
var _projectInfo = {};

function addIdAttribute(nosqlDefinition) {
  nosqlDefinition.newTable.attributes[userId.name] = userId.type;
}

var typeChoices = {
  'string': {code: 'S', indexable: true},
  'number': {code: 'N', indexable: true},
  'binary': {code: 'B', indexable: true},
  'boolean': {code: 'BOOL', indexable: false},
  'list': {code: 'L', indexable: false},
  'map': {code: 'M', indexable: false},
  'null': {code: 'NULL', indexable: false},
  'string set': {code: 'SS', indexable: false},
  'number set': {code: 'NS', indexable: false},
  'binary set': {code: 'BS', indexable: false}
}

function getTypeCode(type) {
  let choice = typeChoices[type];
  if (!choice) {
    return ''
  } else {
    return choice.code;
  }
}

var startQuestionary = (currentDefinition) => new Promise(
  function(resolve, reject) {
    var tableDefinition = {
      hasDynamicPrefix: true,
      read: false,
      write: false,
      table_name: '',
      attributes: {},
      hashKeyName: '',
      hashKeyType: '',
      sortKeyName: '',
      sortKeyType: '',
      indexes: {}
    };

    var nosqlDefinition = {
      newTable: tableDefinition,
      projectDefinition: currentDefinition
    };

    console.log('\n' + 'Welcome to NoSQL database wizard');
    console.log('You will be asked a series of questions to help determine how to best construct your NoSQL database table.' + '\n');

    resolve(nosqlDefinition);
  });

  var startEditing = (currentDefinition) => new Promise(
    function(resolve, reject) {
  
      var nosqlDefinition = {
        newTable: currentDefinition.tableDefinition,
        projectDefinition: currentDefinition,
        editColumn: true,
        editIndex: true
      };
      resolve(nosqlDefinition);
    }
  );

var askRead = (nosqlDefinition) => {
  var readQuestion = {
    type: 'list',
    name: 'read',
    message: 'Would you like users to read each other\'s data',
    choices: [
      {
        key: 'y',
        name: 'Yes: App users will read other user\'s data',
        value: 'yes'
      },
      {
        key: 'n',
        name: 'No: App users will not have any access to other user\'s data',
        value: 'no'
      }
    ],
    default: 'yes'
  };

  return inquirer.prompt(readQuestion).then(answers => {
    nosqlDefinition.newTable.read = answers.read === 'yes';
    return nosqlDefinition;
  });
}

var askUserIdColumn = (nosqlDefinition) => {
  var readQuestion = {
    type: 'list',
    name: 'open_restricted',
    message: 'Should the data of this table be open or restricted by user?',
    choices: [
      {
        name: 'Open',
        value: 'open'
      },
      {
        name: 'Restricted',
        value: 'restricted'
      }
    ],
    default: 'open'
  };

  return inquirer.prompt(readQuestion).then(answers => {
    if (answers['open_restricted'] === 'open') {
      nosqlDefinition.newTable.read = true;
      nosqlDefinition.newTable.write = true;
    } else {
      nosqlDefinition.newTable.read = false;
      nosqlDefinition.newTable.write = false;
      addIdAttribute(nosqlDefinition);
      console.log('\n\n' + 'Note: This will create a column called \"userId\"' + '\n\n');
    }
    
    return nosqlDefinition;
  });
}

var askWrite = (nosqlDefinition) => {
  if (!nosqlDefinition.newTable.read) {
    addIdAttribute(nosqlDefinition);
    return Promise.resolve(nosqlDefinition);
  }

  var writeQuestion = {
    type: 'list',
    name: 'write',
    message: 'Would you like users to write each other\'s data',
    choices: [
      {
        key: 'y',
        name: 'Yes: App users will write other user\'s data',
        value: 'yes'
      },
      {
        key: 'n',
        name: 'No: App users will not write other user\'s data',
        value: 'no'
      }
    ],
    default: 'no'
  };

  return inquirer.prompt(writeQuestion).then(answers => {
    nosqlDefinition.newTable.write = answers.write === 'yes';

    if (!nosqlDefinition.newTable.write) {
      addIdAttribute(nosqlDefinition);
    }

    return nosqlDefinition;
  });
};

var askTableName = (nosqlDefinition) => {
  var tableNameQuestion = {
    type: 'input',
    name: 'table_name',
    message: 'Table name',
    validate: function (value) {
      var pass = value.length > 0;
      if ( /[^a-zA-Z0-9._\-]/.test(value) ) {
         return 'You can use the following characters: a-z A-Z 0-9 . - _';
      }
      let tableSearch = nosqlDefinition.projectDefinition.nosql.tables[value];
      if (tableSearch) {
        return 'Table name ' + value + ' already exists';
      }
      if (pass) {
        return true;
      }
      return 'Please enter a valid table name';
    }
  }

  return inquirer.prompt(tableNameQuestion).then(answers => {
    nosqlDefinition.newTable.table_name = answers.table_name;
    console.log("\n You can now add columns to the table.\n");
    return nosqlDefinition;
  });
}

var startAttributeQuestionary = (nosqlDefinition) => new Promise(
  function(resolve, reject) {
    resolve(nosqlDefinition);
  });

var askAttibuteDefintion = (nosqlDefinition) => {

  var keyChoices = [];
  if (Object.keys(nosqlDefinition.newTable.attributes).length === 0) {
    // only indexable types
    Object.keys(typeChoices).map(type => {
      if (typeChoices[type].indexable) {
        keyChoices.push(type);
      }
    });
  } else {
    keyChoices = Array.from(Object.keys(typeChoices));
  }
  var attributeQuestions = [
    {
      type: 'input',
      name: 'attribute_name',
      message: 'What would you like to name this column',
      validate: function (value) {
        var pass = value.length > 0;
        if ( /[^a-zA-Z0-9_\-]/.test(value) ) {
           return 'You can use the following characters: a-z A-Z 0-9 - _';
        }
        // validate attribute is not created
        let attSearch = nosqlDefinition.newTable.attributes[value];
        if (attSearch) {
          return value + ' column already exists';
        }
        if (pass) {
          return true;
        }
        return 'Please enter a valid column name';
      }
    },
    {
      type: 'list',
      name: 'type',
      message: 'Choose the data type',
      choices: keyChoices
    }
  ];

  return inquirer.prompt(attributeQuestions).then(answers => {
    nosqlDefinition.newTable.attributes[answers.attribute_name] = answers.type;
    return nosqlDefinition;
  });
}

var askAttributes = (nosqlDefinition) => {
  var addAttributeQuestion = {
    type: 'confirm',
    name: 'add_attribute',
    message: 'Would you like to add another column',
    default: true
  };

  // If the attribute list is empty always ask for an attribute
  // check all attributes in order to find one that is indexable
  if (Object.keys(nosqlDefinition.newTable.attributes).length === 0 || nosqlDefinition.editColumn) {
    nosqlDefinition.editColumn = false;
    return startAttributeQuestionary(nosqlDefinition)
    .then(askAttibuteDefintion)
    .then(askAttributes);
  } else {
    return inquirer.prompt(addAttributeQuestion).then(answerAddAttribute => {
      if (!answerAddAttribute.add_attribute) {
        return Promise.resolve(nosqlDefinition);
      } else {
        return startAttributeQuestionary(nosqlDefinition)
        .then(askAttibuteDefintion)
        .then(askAttributes);
      }
    });
  }

}

var askTablePrimaryKey = (nosqlDefinition) => {
  // Get all attributes on the list
  var partitionKeyChoices = [];
  Object.keys(nosqlDefinition.newTable.attributes).map(element => {
    let type = nosqlDefinition.newTable.attributes[element];
    if (typeChoices[type].indexable) {
      partitionKeyChoices.push(element);
    }
  });

  var partitionKeyQuestion = {
    type: 'list',
    name: 'partition_key',
    message: 'Select primary key',
    choices: partitionKeyChoices
  };

  console.log('\n\nBefore you create the database, you must specify how items in your table are uniquely organized. This is done by specifying a Primary key. The primary key uniquely identifies each item in the table, so that no two items can have the same key.\nThis could be and individual column or a combination that has \"primary key\" and a \"sort key\".\nTo learn more about primary key:\n' + nosqlPartitionKeyLearnMore + "\n\n");

  if (!nosqlDefinition.newTable.write) {
    nosqlDefinition.newTable.hashKeyName = userId.name;
    nosqlDefinition.newTable.hashKeyType =
      nosqlDefinition.newTable.attributes[userId.name];
    console.log('We automatically selected the ' + userId.name + " column as the primary key because you chose the table to be restricted. You can optionally choose to add a sort key." + "\n");
    return Promise.resolve(nosqlDefinition);
  } else {
    return inquirer.prompt(partitionKeyQuestion).then(answers => {
      nosqlDefinition.newTable.hashKeyName = answers.partition_key;
      nosqlDefinition.newTable.hashKeyType =
        nosqlDefinition.newTable.attributes[answers.partition_key];
      return nosqlDefinition;
    });
  }
}
var askTableSortKey = (nosqlDefinition) => {
  // Get all attributes on the list except partition key
  var sortKeyChoices = [];
  Object.keys(nosqlDefinition.newTable.attributes).map(function(element) {
    let type = nosqlDefinition.newTable.attributes[element];
    if (typeChoices[type].indexable) {
      sortKeyChoices.push(element);
    }
  });
  var indexPrimaryKey = sortKeyChoices.indexOf(nosqlDefinition.newTable.hashKeyName);
  sortKeyChoices.splice(indexPrimaryKey, 1);
  var noSortKey = '(No Sort Key)';
  sortKeyChoices.push('(No Sort Key)');

  var sortKeyQuestion = {
    type: 'list',
    name: 'sort_key',
    message: 'Select sort key',
    choices: sortKeyChoices
  }

  return inquirer.prompt(sortKeyQuestion).then(answers => {
    if (answers.sort_key == noSortKey) {
        nosqlDefinition.newTable.sortKeyName = '';
    } else {
      nosqlDefinition.newTable.sortKeyName = answers.sort_key;
      nosqlDefinition.newTable.sortKeyType =
        nosqlDefinition.newTable.attributes[answers.sort_key];
    }
    return nosqlDefinition;
  });
}

var startIndexQuestionary = (nosqlDefinition) => new Promise(
  function(resolve, reject) {
    var index = {
      name: '',
      hashKeyName: '',
      hashKeyType: {},
      sortKeyName: '',
      sortKeyType: {}
    };
    var internalDefinition = {
      nosql: nosqlDefinition,
      newIndex: index
    };
    resolve(internalDefinition);
  });

var askIndexName = (internalDefinition) => {
  var indexNameQuestion = {
    type: 'input',
    name: 'index_name',
    message: 'Index name',
    validate: function (value) {
      var pass = value.length > 0;
      if ( /[^a-zA-Z0-9._\-]/.test(value) ) {
         return 'You can use the following characters: a-z A-Z 0-9 . - _';
      }
      let indexSearch = internalDefinition.nosql.newTable.indexes[value];
      if (indexSearch) {
        return 'Index ' + value + ' already exists';
      }
      if (pass) {
        return true;
      }
      return 'Please enter a valid index name';
    }
  };
  return inquirer.prompt(indexNameQuestion).then(answers => {
    internalDefinition.newIndex.name = answers.index_name;
    return (internalDefinition);
  });
}

var askIndexPrimaryKey = (internalDefinition) => {
  // Get all attributes on the list
  var partitionKeyChoices = [];
  Object.keys(internalDefinition.nosql.newTable.attributes).map(element => {
    let type = internalDefinition.nosql.newTable.attributes[element];
    if (typeChoices[type].indexable) {
      partitionKeyChoices.push(element);
    }
  });

  var partitionKeyQuestion = {
    type: 'list',
    name: 'partition_key',
    message: 'Select partition key',
    choices: partitionKeyChoices
  }

  if (!internalDefinition.nosql.newTable.read) {
    internalDefinition.newIndex.hashKeyName = userId.name;
    internalDefinition.newIndex.hashKeyType = userId.type;
    return Promise.resolve(internalDefinition);
  } else {
    return inquirer.prompt(partitionKeyQuestion).then(answers => {
      internalDefinition.newIndex.hashKeyName = answers.partition_key;
      internalDefinition.newIndex.hashKeyType =
        internalDefinition.nosql.newTable.attributes[answers.partition_key];
      return internalDefinition;
    });
  }
}

var askIndexSortKey = (internalDefinition) => {
  // Get all attributes on the list except partition key
  var sortKeyChoices = [];
  Object.keys(internalDefinition.nosql.newTable.attributes).map(element => {
    let type = internalDefinition.nosql.newTable.attributes[element];
    if (typeChoices[type].indexable) {
      sortKeyChoices.push(element);
    }
  });
  var indexPrimaryKey = sortKeyChoices.indexOf(internalDefinition.newIndex.hashKeyName);
  sortKeyChoices.splice(indexPrimaryKey, 1);
  var noSortKey = '(No Sort Key)';
  sortKeyChoices.push('(No Sort Key)');

  var sortKeyQuestion = {
    type: 'list',
    name: 'sort_key',
    message: 'Select sort key',
    choices: sortKeyChoices
  }

  return inquirer.prompt(sortKeyQuestion).then(answers => {
    if (answers.sort_key == noSortKey) {
        internalDefinition.newIndex.sortKeyName = '';
    } else {
      internalDefinition.newIndex.sortKeyName = answers.sort_key;
      internalDefinition.newIndex.sortKeyType =
        internalDefinition.nosql.newTable.attributes[answers.sort_key];
    }
    return internalDefinition;
  });
}

var addIndex = (internalDefinition) => {
  internalDefinition.nosql.newTable.indexes[internalDefinition.newIndex.name] =
    internalDefinition.newIndex;
  return internalDefinition;
}

var askIndexes = (nosqlDefinition) => {
  if (Object.keys(nosqlDefinition.newTable.indexes).length >= 5) {
    return Promise.resolve(nosqlDefinition);
  }

  var addIndexQuestion = {
    type: 'confirm',
    name: 'add_index',
    message: 'Add index',
    default: true
  };

  if (nosqlDefinition.editIndex) {
    nosqlDefinition.editIndex = false;
    return startIndexQuestionary(nosqlDefinition)
    .then(askIndexName)
    .then(askIndexPrimaryKey)
    .then(askIndexSortKey)
    .then(addIndex)
    .then(definition => {return askIndexes(definition.nosql)});
  }

  return inquirer.prompt(addIndexQuestion).then(answerAddIndex => {
    if (!answerAddIndex.add_index) {
      return nosqlDefinition;
    } else {
      return startIndexQuestionary(nosqlDefinition)
      .then(askIndexName)
      .then(askIndexPrimaryKey)
      .then(askIndexSortKey)
      .then(addIndex)
      .then(definition => {return askIndexes(definition.nosql)});
    }
  });
}

var indexMessage = (nosqlDefinition) => {
  console.log('\nYou can optionally add global secondary indexes for this table. These are useful when running queries defined by a different column than the primary key.\nTo learn more about indexes: \n' + nosqlIndexLearnMore + "\n");
  return nosqlDefinition;
}

var addTable = (nosqlDefinition) => {
  nosqlDefinition.projectDefinition.nosql.tables[nosqlDefinition.newTable.table_name] =
    nosqlDefinition.newTable;

  let yaml = createYamlStructure(nosqlDefinition.projectDefinition);
  mhYamlLib.save(_projectInfo, yaml, () => {
    console.log('Table %s saved', nosqlDefinition.newTable.table_name);;
  });

  return Promise.resolve(nosqlDefinition.projectDefinition.nosql.tables);
}

var createYamlStructure = (projectDefinition) => {
  var tables = [];

  Object.keys(projectDefinition.nosql.tables).map(tableKey => {
    let table = projectDefinition.nosql.tables[tableKey];
    var attributes = {};
    Object.keys(table.attributes).map(element => {
      // Add attribute only if are no hashKey or sortKey
      if (element != table.hashKeyName && element != table.sortKeyName) {
        attributes[element] = getTypeCode([table.attributes[element]]);
      }
    });
    var finalTableName = table.table_name;
    if (table.hasDynamicPrefix) {
      finalTableName = '___DYNAMIC_PREFIX___-' + finalTableName;
    }
    var yamlTable = new mhYamlLib.NoSQLTable(
      attributes,
      table.hashKeyName,
      getTypeCode(table.hashKeyType),
      table.sortKeyName,
      getTypeCode(table.sortKeyType),
      finalTableName,
      'private', // default but expecting read, write values
      []
    );

    if (table.write) {
      yamlTable.tablePrivacy = 'public';
    } else if (table.read) {
      yamlTable.tablePrivacy = 'protected';
    }
    var indexes = [];
    Object.keys(table.indexes).map((indexKey) => {
      let element = table.indexes[indexKey];
      indexes.push(new mhYamlLib.NoSQLIndex(
        element.hashKeyName,
        getTypeCode(element.hashKeyType),
        element.sortKeyName,
        getTypeCode(element.sortKeyType),
        element.name)
      );
    });
    yamlTable.indexes = indexes;
  tables.push(yamlTable);
  });

  var databaseNoSQL = new mhYamlLib.DatabaseNoSQL({'tables': tables});
  var database = new mhYamlLib.Database({'components': {'database-nosql': databaseNoSQL}});
  // In case the feature was not enabled
  projectDefinition['yamlDefinition']['features']['database'] = database;
  return projectDefinition['yamlDefinition'];
}

function createTable(currentDefinition) {
  startQuestionary(currentDefinition)
  .then(askUserIdColumn)
  .then(askTableName)
  .then(askAttributes)
  .then(askTablePrimaryKey)
  .then(askTableSortKey)
  .then(indexMessage)
  .then(askIndexes)
  .then(addTable)
  .catch(console.log.bind(null, 'ERROR'));
}

function deleteTable(currentDefinition) {
  var tableList = Array.from(Object.keys(currentDefinition.nosql.tables));

  var deleteQuestion = [
    {
      type: 'list',
      name: 'table_key',
      message: 'Select table to be deleted',
      choices: tableList
    },
    {
      type: 'confirm',
      name: 'confirm_delete',
      message: 'Are you sure you want to delete the table',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers.confirm_delete) {
      console.log('No table deleted');
    } else {
      delete currentDefinition.nosql.tables[answers.table_key];

      let yaml = createYamlStructure(currentDefinition);

      mhYamlLib.save(_projectInfo, yaml, () => {
        console.log('Table %s deleted', answers.table_key);;
      });
    }
  });
}

function editTable(currentDefinition) {
  var tableList = Array.from(Object.keys(currentDefinition.nosql.tables));

  var editQuestion = [
    {
      type: 'list',
      name: 'edit_table_key',
      message: 'Select table to be edited',
      choices: tableList
    },
    {
      type: 'list',
      name: 'edit_options',
      message: 'Select from one of the choices below.',
      choices: [
        {
          name: 'Add columns',
          value: 'add_column'
        },
        {
          name: 'Remove column',
          value: 'remove_column'
        },
        {
          name: 'Add indexes',
          value: 'add_index'
        },
        {
          name: 'Remove index',
          value: 'remove_index'
        }
      ]
    }];

  return inquirer.prompt(editQuestion).then(answers => {
    currentDefinition.tableDefinition = currentDefinition.nosql.tables[answers['edit_table_key']];
    if (answers['edit_options'] === 'add_column') {
      return addColumnExistingTable(currentDefinition);
    } else if (answers['edit_options'] === 'remove_column') {
      return removeColumnExistingTable(currentDefinition);
    } else if (answers['edit_options'] === 'add_index') {
      return addIndexExistingTable(currentDefinition);
    } else if (answers['edit_options'] === 'remove_index') {
      return removeIndexExistingTable(currentDefinition);
    }
  });
}

function deleteIndex(nosqlDefinition) {
  var indexList = Array.from(Object.keys(nosqlDefinition.newTable.indexes));

  if (indexList.length === 0) {
    return Promise.reject('Table has no indexes', nosqlDefinition);
  }

  var deleteQuestion = [
    {
      type: 'list',
      name: 'index_key',
      message: 'Select Index to be deleted',
      choices: indexList
    },
    {
      type: 'confirm',
      name: 'confirm_index_delete',
      message: 'Are you sure you want to delete the Index',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers['confirm_index_delete']) {
      return Promise.reject('No Index deleted', nosqlDefinition);
    } else {
      delete nosqlDefinition.newTable.indexes[answers['index_key']];
      return (nosqlDefinition);
    }
  });
}

function deleteAttribute(nosqlDefinition) {
  var attributeList = Array.from(Object.keys(nosqlDefinition.newTable.attributes));
  var deleteQuestion = [
    {
      type: 'list',
      name: 'attribute_key',
      message: 'Select Column to be deleted',
      choices: attributeList
    },
    {
      type: 'confirm',
      name: 'confirm_attribute_delete',
      message: 'Are you sure you want to delete the Column',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers['confirm_attribute_delete']) {
      return Promise.reject('No Column deleted', nosqlDefinition);
    } else {
      // check if column isnt hashKey, rangeKey on the table or indexes
      const attributeSelected = answers['attribute_key'];

      if (attributeSelected === nosqlDefinition.newTable.hashKeyName) {
        return Promise.reject('Error: Can not delete Column ' + attributeSelected + ' because is primary key of the table');
      }
      if (attributeSelected === nosqlDefinition.newTable.sortKeyName) {
        return Promise.reject('Error: Can not delete Column ' + attributeSelected + ' because is sort key of the table');
      }

      let result = null;
      Object.keys(nosqlDefinition.newTable.indexes).forEach(indexKey => {
        if (attributeSelected === nosqlDefinition.newTable.indexes[indexKey].hashKeyName) {
          result = 'Error: Can not delete Column ' + attributeSelected + ' because is primary key of the Index ' + indexKey;
        }
        if (attributeSelected === nosqlDefinition.newTable.indexes[indexKey].sortKeyName) {
          result = 'Error: Can not delete Column ' + attributeSelected + ' because is sort key of the Index ' + indexKey;
        }  
      });

      if (result) {
        return Promise.reject(result);
      } 
      delete nosqlDefinition.newTable.attributes[attributeSelected];
      return (nosqlDefinition);
    }
  });
}

function addColumnExistingTable(currentDefinition) {
  startEditing(currentDefinition)
  .then(askAttributes)
  .then(addTable)
  .catch(console.log.bind(null, ''));
}

function removeColumnExistingTable(currentDefinition) {
  startEditing(currentDefinition)
  .then(deleteAttribute)
  .then(addTable)
  .catch(console.log.bind(null, ''));
}

function addIndexExistingTable(currentDefinition) {
  startEditing(currentDefinition)
  .then(askIndexes)
  .then(addTable)
  .catch(console.log.bind(null, ''));
}

function removeIndexExistingTable(currentDefinition) {
  startEditing(currentDefinition)
  .then(deleteIndex)
  .then(addTable)
  .catch(console.log.bind(null, ''));
}

function createTableJsonStructure(yamlDefinition) {
  var jsonTableStructure = {};
  // Get table array from yaml
  var tables = [];
  if (yamlDefinition['features'] && yamlDefinition['features']['database']) {
    tables = JSON.parse(JSON.stringify(yamlDefinition['features']['database']['components']['database-nosql']['tables']));
  }

  // Create json question structure forEach table
  tables.forEach((table) => {
    var newAttributes = table.attributes;
    // Add hashKey as attribute of the table
    table.attributes[table.hashKeyName] = table.hashKeyType;

    // Add sortKey as attribute if exists
    if (table.rangeKeyName && table.rangeKeyName !== '') {
      table.attributes[table.rangeKeyName] = table.rangeKeyType;
    }

    // Get attribute type from code type
    Object.keys(newAttributes).map(attKey => {
      Object.keys(typeChoices).map(type => {
        if (typeChoices[type].code === newAttributes[attKey]) {
          newAttributes[attKey] = type;
        }
      })
    });

    // Crete indexes
    var newIndexes = {};
    if (table.indexes) {
      table.indexes.forEach((index) => {
        var newHashKeyType = '';
        var newSortKeyType = '';

        // Get attribute type from code type
        Object.keys(typeChoices).map(type => {
          if (typeChoices[type].code === index.hashKeyType) {
            newHashKeyType = type;
          }
          if (typeChoices[type].code === index.rangeKeyType) {
            newSortKeyType = type;
          }
        });
        var newIndex = {
          hashKeyName: index.hashKeyName,
          sortKeyName: index.rangeKeyName,
          hashKeyType: newHashKeyType,
          sortKeyType: newSortKeyType,
          name: index.indexName
        };
        newIndexes[index.indexName] = newIndex;
        // TODO: add validation in case is repeated or inconsistent
      });
    }

    // Removing ___DYNAMIC_PREFIX___- in case it exists
    var newTableName = table.tableName;
    var hasDynamicPrefix = false;
    if (newTableName.startsWith('___DYNAMIC_PREFIX___-')) {
      newTableName = newTableName.substring(21);
      hasDynamicPrefix = true;
    }

    // Get read, write permission from tablePrivacy
    var newRead = false, newWrite = false; // Default and private table
    switch (table.tablePrivacy) {
      case 'public':
        newRead = true;
        newWrite = true;
        break;
      case 'protected':
        newRead = true;
        break;
      default:
        break;
    }

    // Get hashKeyType and sortKeyType from code// Get attribute type from code type
    var newHashKeyType = '', newSortKeyType = '';
    Object.keys(typeChoices).map(type => {
      if (typeChoices[type].code === table.hashKeyType) {
        newHashKeyType = type;
      }
      if (typeChoices[type].code === table.rangeKeyType) {
        newSortKeyType = type;
      }
    });

    // TODO: Check consistency again hashKeyType, hashKeyName
    var newTable = {
      read: newRead,
      write: newWrite,
      table_name: newTableName,
      hasDynamicPrefix: hasDynamicPrefix,
      hashKeyName: table.hashKeyName,
      hashKeyType: newHashKeyType,
      sortKeyName: table.rangeKeyName,
      sortKeyType: newSortKeyType,
      attributes: newAttributes,
      indexes: newIndexes,

    };
    // TODO: Check if table already exist and take some action
    jsonTableStructure[newTable.table_name] = newTable;
  });

  return jsonTableStructure;
}

function main() {

  var currentDefinition = {
    nosql: {tables: {}},
    yamlDefinition: {}
  }

  mhYamlLib.load(_projectInfo, (yamlDefinition) => {
    currentDefinition.nosql.tables = createTableJsonStructure(yamlDefinition);
    currentDefinition.yamlDefinition = yamlDefinition;

    // No table on the project always add
    if (Object.keys(currentDefinition.nosql.tables).length === 0) {
      return createTable(currentDefinition);
    }

    var optionsQuestion = {
      type: 'list',
      name: 'options',
      message: 'Select from one of the choices below.',
      choices: [
        {
          name: 'Create a new table',
          value: 'add'
        },
        {
          name: 'Remove table from the project',
          value: 'del'
        },
        {
          name: 'Edit table from the project',
          value: 'edit'
        }
      ],
      default: 'add'
    };

    return inquirer.prompt(optionsQuestion).then(answers => {
      if (answers.options === 'add') {
        return createTable(currentDefinition)
      } else if (answers.options === 'del') {
        return deleteTable(currentDefinition);
      } else if (answers.options === 'edit') {
        return editTable(currentDefinition);
      }
    });
  });
}

exports.getTypeCode = function(type) {
  return getTypeCode(type);
}

exports.createTableJsonStructure = function(yamlDefinition) {
  return createTableJsonStructure(yamlDefinition);
}

exports.specify = function(projectInfo) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
  main();
}

exports.onFeatureTurnOn = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}

exports.onFeatureTurnOff = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}