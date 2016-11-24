class DeletePortsFromService < ActiveRecord::Migration
  def change
    remove_column :services, :tcp_ports
    remove_column :services, :udp_ports
    remove_column :services, :inet_tcp
    remove_column :services, :inet_udp
  end
end
