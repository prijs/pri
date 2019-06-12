import * as _ from 'lodash';
import { logFatal } from './log';
import { TransferedRegisterCommand, CommandRegister } from './define';

// Transfer commands array to commands map
export function transferCommandsArrayToMap(commandRegisters: CommandRegister[]) {
  const duplicates = getDuplicatesCommand(commandRegisters);
  if (duplicates.length > 0) {
    logFatal(
      `Duplicate commands:\n${duplicates
        .map(duplicate => {
          return duplicate;
        })
        .join('\n')}`
    );
  }

  return createRootCommandRegisters(commandRegisters);
}

function createRootCommandRegisters(
  commandRegistersSplitName: TransferedRegisterCommand[]
): TransferedRegisterCommand[] {
  const rootNames = _.uniq(
    commandRegistersSplitName.map(commandRegisterSplitName => {
      return commandRegisterSplitName.name[0];
    })
  );

  const rootCommandRegisters = commandRegistersSplitName.filter(commandRegisterSplitName => {
    return commandRegisterSplitName.name.length === 1;
  });

  const leafCommandRegisters = commandRegistersSplitName.filter(commandRegisterSplitName => {
    return commandRegisterSplitName.name.length > 1;
  });

  return rootNames.map(rootName => {
    const childs = leafCommandRegisters
      .filter(leafCommandRegister => {
        return leafCommandRegister.name[0] === rootName;
      })
      .map(leafCommandRegister => {
        return {
          ...leafCommandRegister,
          name: leafCommandRegister.name.slice(1, leafCommandRegister.name.length)
        };
      });

    const commandRegisterExactByName = rootCommandRegisters.find(parentCommandRegister => {
      return parentCommandRegister.name[0] === rootName;
    });
    if (commandRegisterExactByName) {
      return { ...commandRegisterExactByName, childs: createRootCommandRegisters(childs) };
    }
    return {
      name: [rootName],
      childs: createRootCommandRegisters(childs)
    };
  });
}

function getDuplicatesCommand(commandRegisters: CommandRegister[]) {
  return _.filter(
    commandRegisters.map(commandRegister => {
      return commandRegister.name;
    }),
    (value, index, iteratee) => {
      return _.includes(iteratee, value, index + 1);
    }
  );
}
