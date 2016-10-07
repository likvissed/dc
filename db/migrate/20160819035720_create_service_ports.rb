class CreateServicePorts < ActiveRecord::Migration
  def change
    create_table :service_ports do |t|
      t.references  :service_network
      t.text        :local_tcp_ports
      t.text        :local_udp_ports
      t.text        :inet_tcp_ports
      t.text        :inet_udp_ports
      t.string      :host_class
      t.text        :tcp_ports_2
      t.text        :udp_ports_2
      t.timestamps null: false
      t.timestamps null: false
    end
  end
end
