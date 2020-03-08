import * as babelJest from 'babel-jest';
import { getBabelOptions } from '../../../utils/babel-options';

module.exports = babelJest.createTransformer(getBabelOptions());
