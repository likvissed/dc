class CreateServiceNetworks < ActiveRecord::Migration
  def change
    create_table :service_networks do |t|
      t.references  :service
      t.string      :segment,   limit: 50
      t.string      :vlan,      limit: 20
      t.string      :dns_name
      t.timestamps null: false
    end
  end
end
