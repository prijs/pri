import * as webpack from 'webpack';
import * as ConcatSource from 'webpack-sources';
import * as _ from 'lodash';
import { pri } from '../node';

export class WrapContent {
  private header = '';

  private footer = '';

  public constructor(header = '', footer = '') {
    this.header = header;
    this.footer = footer;
  }

  public apply(compiler: webpack.Compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('optimize-chunk-assets', (chunks: any[], done: any) => {
        chunks.forEach(chunk => {
          chunk.files.forEach((fileName: string) => {
            // Ignore workers
            if (fileName.indexOf('worker.js') > -1) {
              return;
            }

            if (chunk.name === 'main' || _.has(pri.sourceConfig.entries, chunk.name)) {
              compilation.assets[fileName] = new ConcatSource.ConcatSource(
                this.header,
                compilation.assets[fileName],
                this.footer,
              );
            }
          });
        });
        done();
      });
    });
  }
}
