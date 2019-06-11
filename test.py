import sys
import time
from typing import Optional

import click
from click.testing import CliRunner
import sh
# noinspection PyUnresolvedReferences
from sh import tail


def is_debugging():
    return not (sys.gettrace() is None)


def process_output(line):
    print(line)


@click.command()
@click.argument('test')
def main(test):
    """Console script for docker-svtplay-dl"""

    try:
        command: sh.RunningCommand = tail('-f', '/var/log/system.log', _bg=True)
        time.sleep(2)
        command.process.terminate()
        print(command.stdout)
    except BaseException as err:

        pass





if __name__ == "__main__":
    if is_debugging():
        runner = CliRunner()
        runner.invoke(main)
    else:
        main()
